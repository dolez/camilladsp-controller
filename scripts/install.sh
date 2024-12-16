#!/bin/bash

function setup_hotspot() {
    echo "Configuration du Raspberry Pi comme hotspot..."

    # Mise à jour système
    sudo apt-get update && sudo apt-get upgrade -y

    # Installation des dépendances
    sudo apt install -y hostapd dnsmasq nodejs npm \
                       avahi-daemon avahi-utils libavahi-compat-libdnssd1 \
                       libavahi-core7 libavahi-common3 libavahi-client3 python3-avahi

    # Configuration hostapd
    cat > /etc/hostapd/hostapd.conf << EOF
interface=wlan0
ssid=CamillaHotspot
hw_mode=g
channel=7
wmm_enabled=1
auth_algs=1
ignore_broadcast_ssid=0
EOF

    # Configuration dnsmasq
    cat > /etc/dnsmasq.conf << EOF
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF

    # Configuration Avahi
    sed -i 's/#enable-dbus=yes/enable-dbus=yes/' /etc/avahi/avahi-daemon.conf

    # Configuration dbus pour Avahi
    cat > /etc/dbus-1/system.d/avahi-dbus.conf << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE busconfig PUBLIC "-//freedesktop//DTD D-Bus Bus Configuration 1.0//EN"
"http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
  <policy context="default">
    <allow own="org.freedesktop.Avahi"/>
    <allow send_destination="org.freedesktop.Avahi"/>
  </policy>
</busconfig>
EOF

    # Activation des services
    sudo systemctl unmask hostapd
    sudo systemctl enable hostapd
    sudo systemctl restart hostapd
    sudo systemctl restart dnsmasq
    sudo systemctl restart avahi-daemon

    # Configuration réseau
    sudo sysctl -w net.ipv4.ip_forward=1
    echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

    # Configuration NetworkManager
    sudo nmcli connection add type wifi ifname wlan0 con-name Hotspot \
         ssid "CamillaHotspot" mode ap
    sudo nmcli connection modify Hotspot ipv4.addresses 192.168.4.1/24 \
         ipv4.method manual

    # Démarrage du hotspot
    sudo nmcli connection up Hotspot

    echo "Configuration du hotspot terminée!"
}

function setup_node() {
    echo "Configuration du Raspberry Pi comme node..."

    # Mise à jour système
    sudo apt-get update && sudo apt-get upgrade -y

    # Installation des dépendances
    sudo apt install -y nodejs npm avahi-daemon avahi-utils \
                       libavahi-compat-libdnssd1 libavahi-core7 \
                       libavahi-common3 libavahi-client3 python3-avahi

    # Configuration Avahi
    sed -i 's/#enable-dbus=yes/enable-dbus=yes/' /etc/avahi/avahi-daemon.conf

    # Configuration NetworkManager pour se connecter au hotspot
    sudo nmcli connection add type wifi ifname wlan0 con-name CamillaNode \
         ssid CamillaHotspot

    # Démarrage de la connexion
    sudo nmcli connection up CamillaNode

    echo "Configuration du node terminée!"
}

# Configuration commune aux deux types

function setup_common() {
    # Configuration UART
    echo "dtoverlay=dwc2" | sudo tee -a /boot/config.txt
    echo "enable_uart=1" | sudo tee -a /boot/config.txt
    
    # Configuration audio
    cat >> /boot/config.txt << EOF
dtoverlay=wm8960
dtoverlay=i2s-mmap
dtoverlay=wm8960-soundcard
hdmi_force_hotplug=1
hdmi_group=1
hdmi_mode=16
EOF

    # Configuration UART dans cmdline.txt
    sudo sed -i 's/$/ modules-load=dwc2,g_serial/' /boot/cmdline.txt

    # Activation du service série
    sudo systemctl enable serial-getty@ttyGS0.service
    sudo systemctl start serial-getty@ttyGS0.service

    echo "Configuration commune terminée!"
}

# Script d'utilisation
cat << EOF
Usage: 
    Pour configurer un hotspot:
        ./install.sh hotspot
    Pour configurer un node:
        ./install.sh node

Les deux commandes effectueront d'abord la configuration commune.
EOF

case "$1" in
    "hotspot")
        setup_common
        setup_hotspot
        ;;
    "node")
        setup_common
        setup_node
        ;;
    *)
        echo "Argument invalide. Utilisez 'hotspot' ou 'node'."
        exit 1
        ;;
esac