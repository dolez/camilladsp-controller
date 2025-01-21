#!/bin/bash
set -e

TIMEOUT=10
HOTSPOT_SSID="CamillaDSP"
ROLE_FILE="/var/lib/camilladsp/role"

mkdir -p /var/lib/camilladsp

# Assurer que wlan0 est managed
nmcli device set wlan0 managed yes

# Fonction pour activer le rôle master
activate_master() {
    echo "master" > "${ROLE_FILE}"
    # Nettoyage de l'ancienne configuration si elle existe
    nmcli connection delete Hotspot 2>/dev/null || true
    # Créer et activer le hotspot
    nmcli connection add type wifi ifname wlan0 con-name Hotspot ssid "${HOTSPOT_SSID}" mode ap
    nmcli connection modify Hotspot ipv4.addresses 192.168.4.1/24 ipv4.method shared
    nmcli connection up Hotspot
    systemctl restart avahi-daemon
}

# Fonction pour activer le rôle node
activate_node() {
    echo "node" > "${ROLE_FILE}"
    # Se connecter au hotspot avec timeout
    if ! timeout ${TIMEOUT} nmcli device wifi connect "${HOTSPOT_SSID}"; then
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
    if nmcli device wifi list --rescan yes | grep -q "${HOTSPOT_SSID}" || \
       timeout ${TIMEOUT} sh -c "until nmcli device wifi list | grep -q '${HOTSPOT_SSID}'; do sleep 1; done"; then
        echo "Hotspot trouvé, activation du mode node"
        activate_node
    else
        echo "Aucun hotspot trouvé après ${TIMEOUT}s, activation du mode master"
        activate_master
    fi
fi

# Démarrage des services communs
systemctl enable --now camilladsp
systemctl enable --now nginx