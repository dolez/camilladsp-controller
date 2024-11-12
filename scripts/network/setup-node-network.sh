#!/bin/bash
# Configuration réseau pour les nodes CamillaDSP

set -e

# Configuration du client WiFi
setup_wifi_client() {
    # Configuration de wpa_supplicant
    cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOL
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=FR

network={
    ssid="CamillaDSP-Network"
    psk="CamillaDSPSecurePass"
    key_mgmt=WPA-PSK
}
EOL

    # Redémarrage du service
    systemctl restart wpa_supplicant
}

# Configuration de l'interface réseau
setup_network() {
    # Configuration DHCP pour wlan0
    cat > /etc/dhcpcd.conf << EOL
interface wlan0
    hostname CamillaDSP-Node
EOL

    # Redémarrage du service
    systemctl restart dhcpcd
}

main() {
    setup_wifi_client
    setup_network
    
    echo "Configuration réseau du node terminée"
    echo "Le node va maintenant se connecter au réseau CamillaDSP-Network"
}

main