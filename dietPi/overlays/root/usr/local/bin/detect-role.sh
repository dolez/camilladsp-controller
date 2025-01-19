#!/bin/bash
set -e

TIMEOUT=30
HOTSPOT_SSID="CamillaDSP"
ROLE_FILE="/var/lib/camilladsp/role"
mkdir -p /var/lib/camilladsp

# Fonction pour activer le rôle master
activate_master() {
    echo "master" > "${ROLE_FILE}"
    systemctl enable --now hostapd
    systemctl enable --now dnsmasq
    systemctl restart avahi-daemon
}

# Fonction pour activer le rôle node
activate_node() {
    echo "node" > "${ROLE_FILE}"
    systemctl disable --now hostapd
    systemctl disable --now dnsmasq
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