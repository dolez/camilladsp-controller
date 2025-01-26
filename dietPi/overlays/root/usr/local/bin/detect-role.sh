#!/bin/bash
set -e

TIMEOUT=10
HOTSPOT_SSID="CamillaDSP"
ROLE_FILE="/var/lib/camilladsp/role"
HOSTAPD_CONF="/etc/hostapd/hostapd.conf"
WPA_CONF="/etc/wpa_supplicant/wpa_supplicant.conf"

mkdir -p /var/lib/camilladsp

# Assurer que le power save est désactivé
iw dev wlan0 set power_save off 2>/dev/null || true

# Fonction pour obtenir un nom unique basé sur l'adresse MAC
get_unique_hostname() {
    # Récupère les 4 derniers caractères de l'adresse MAC de wlan0
    MAC_SUFFIX=$(cat /sys/class/net/wlan0/address | tr -d ':' | tail -c 5)
    echo "node-${MAC_SUFFIX}"
}

# Fonction pour activer le rôle master
activate_master() {
    echo "master" > "${ROLE_FILE}"
    
    # Configuration du hostname
    hostnamectl set-hostname dietpi
    echo "127.0.1.1 dietpi.local dietpi" >> /etc/hosts
    
    # Configuration de hostapd
    cat > "${HOSTAPD_CONF}" << EOF
interface=wlan0
driver=nl80211
ssid=${HOTSPOT_SSID}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=0
EOF
    
    # Configuration du réseau
    ip link set wlan0 down
    ip addr flush dev wlan0
    ip addr add 192.168.4.1/24 dev wlan0
    ip link set wlan0 up
    
    # Démarrage des services
    systemctl restart dnsmasq
    systemctl restart hostapd
    systemctl restart avahi-daemon
    systemctl start camilladsp-monitor.service
}

# Fonction pour activer le rôle node
activate_node() {
    # Génère un nom d'hôte unique
    UNIQUE_HOSTNAME=$(get_unique_hostname)
    echo "node" > "${ROLE_FILE}"
    
    # Configuration du hostname
    hostnamectl set-hostname "${UNIQUE_HOSTNAME}"
    echo "127.0.1.1 ${UNIQUE_HOSTNAME}.local ${UNIQUE_HOSTNAME}" >> /etc/hosts
    
    # Configuration de wpa_supplicant
    cat > "${WPA_CONF}" << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=FR

network={
    ssid="${HOTSPOT_SSID}"
    key_mgmt=NONE
}
EOF
    
    # Arrêt des services master si actifs
    systemctl stop hostapd dnsmasq || true
    
    # Configuration du réseau
    ip link set wlan0 down
    ip addr flush dev wlan0
    ip link set wlan0 up
    
    # Démarrage de wpa_supplicant et attente de connexion
    wpa_supplicant -B -i wlan0 -c "${WPA_CONF}"
    if ! timeout ${TIMEOUT} sh -c 'until ip addr show wlan0 | grep -q "inet "; do sleep 1; done'; then
        echo "Erreur de connexion au hotspot"
        exit 1
    fi
    
    systemctl restart avahi-daemon
}

# Vérifier d'abord si un rôle existe déjà
if [ -f "${ROLE_FILE}" ]; then
    ROLE=$(cat "${ROLE_FILE}")
    echo "Rôle existant trouvé: ${ROLE}"
    if [ "${ROLE}" = "master" ]; then
        activate_master
    else
        activate_node
    fi
else
    # Logique de détection initiale
    echo "Recherche du hotspot ${HOTSPOT_SSID}..."
    if iw dev wlan0 scan | grep -q "${HOTSPOT_SSID}" || \
       timeout ${TIMEOUT} sh -c "until iw dev wlan0 scan | grep -q '${HOTSPOT_SSID}'; do sleep 1; done"; then
        echo "Hotspot trouvé, activation du mode node"
        activate_node
    else
        echo "Aucun hotspot trouvé après ${TIMEOUT}s, activation du mode master"
        activate_master
    fi
fi