#!/bin/bash
# Configuration du réseau pour le Raspberry Pi maître

set -e

# Variables de configuration
WIFI_SSID="CamillaDSP-Network"
WIFI_PASS="CamillaDSPSecurePass"
AP_IP="192.168.4.1"
DHCP_RANGE_START="192.168.4.2"
DHCP_RANGE_END="192.168.4.20"



#!/bin/bash
# scripts/setup-network.sh

# Installation des paquets nécessaires
install_packages() {
    apt-get update
    apt-get install -y \
        hostapd \
        dnsmasq \
        iptables \
        netfilter-persistent \
        iptables-persistent

    # Arrêt des services pour la configuration
    systemctl stop hostapd
    systemctl stop dnsmasq
}

# Configuration du point d'accès WiFi
setup_hostapd() {
    cat > /etc/hostapd/hostapd.conf << EOL
# Interface WiFi
interface=wlan0
# Mode point d'accès
driver=nl80211
# Nom du réseau WiFi
ssid=CamillaDSP-Network
# Canal WiFi
channel=7
# Mode WiFi (a = IEEE 802.11a, b = IEEE 802.11b, g = IEEE 802.11g)
hw_mode=g
# Active le WPA2
wpa=2
# Mot de passe WPA2
wpa_passphrase=CamillaDSPSecurePass
# Configurations WPA2
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
# Active l'interface
ignore_broadcast_ssid=0
EOL

    # Configurer hostapd pour utiliser ce fichier
    echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' > /etc/default/hostapd
}

# Configuration du serveur DHCP
setup_dnsmasq() {
    # Sauvegarde de la configuration originale
    mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig

    cat > /etc/dnsmasq.conf << EOL
# Interface d'écoute
interface=wlan0
# Ne pas transmettre les requêtes DNS
no-resolv
# Serveurs DNS (utilisation de Google DNS ici)
server=8.8.8.8
server=8.8.4.4
# Plage d'adresses IP pour les clients
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
# Route par défaut
dhcp-option=3,192.168.4.1
# DNS
dhcp-option=6,192.168.4.1
EOL
}

# Configuration de l'interface réseau
setup_network_interface() {
    # Configuration de l'interface wlan0
    cat > /etc/dhcpcd.conf << EOL
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant
EOL
}

# Configuration du routage et du pare-feu
setup_routing() {
    # Activer le forwarding IP
    echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-ipforward.conf
    sysctl -p /etc/sysctl.d/99-ipforward.conf

    # Règles iptables pour le NAT
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    iptables -A FORWARD -i eth0 -o wlan0 -m state --state RELATED,ESTABLISHED -j ACCEPT
    iptables -A FORWARD -i wlan0 -o eth0 -j ACCEPT

    # Sauvegarder les règles iptables
    netfilter-persistent save
}

# Démarrage des services
start_services() {
    systemctl unmask hostapd
    systemctl enable hostapd
    systemctl enable dnsmasq
    
    # Redémarrage des services
    systemctl restart dhcpcd
    systemctl restart hostapd
    systemctl restart dnsmasq
}

# Function principale
main() {
    install_packages
    setup_hostapd
    setup_dnsmasq
    setup_network_interface
    setup_routing
    start_services
    
    echo "Configuration du point d'accès WiFi terminée"
    echo "SSID: CamillaDSP-Network"
    echo "Mot de passe: CamillaDSPSecurePass"
    echo "IP du point d'accès: 192.168.4.1"
}

main