#!/bin/bash
set -e

TIMEOUT=30
HOTSPOT_SSID="CamillaDSP"
ROLE_FILE="/var/lib/camilladsp/role"
mkdir -p /var/lib/camilladsp

# Fonction pour activer le rôle master
activate_master() {
    echo "master" > "${ROLE_FILE}"
    # Créer et activer le hotspot
    nmcli connection add type wifi ifname wlan0 con-name Hotspot ssid "${HOTSPOT_SSID}" mode ap
    nmcli connection modify Hotspot ipv4.addresses 192.168.4.1/24 ipv4.method manual
    nmcli connection up Hotspot
    systemctl restart avahi-daemon
}

# Fonction pour activer le rôle node
activate_node() {
    echo "node" > "${ROLE_FILE}"
    # Se connecter au hotspot
    nmcli device wifi connect "${HOTSPOT_SSID}"
    systemctl restart avahi-daemon
}

# Attente de la détection du hotspot
echo "Recherche du hotspot ${HOTSPOT_SSID}..."
if nmcli device wifi list --rescan yes | grep -q "${HOTSPOT_SSID}" || \
   timeout ${TIMEOUT} sh -c "until nmcli device wifi list | grep -q '${HOTSPOT_SSID}'; do sleep 1; done"; then
    echo "Hotspot trouvé, activation du mode node"
    activate_node
else
    echo "Aucun hotspot trouvé après ${TIMEOUT}s, activation du mode master"
    activate_master
fi

# Démarrage des services communs
systemctl enable --now camilladsp
systemctl enable --now nginx 