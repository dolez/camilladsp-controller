#!/bin/bash

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

check_master_network() {
    echo "Test de la configuration réseau du maître..."
    
    # Vérification des services
    services=("hostapd" "dnsmasq")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            echo -e "${GREEN}✓${NC} Service $service est actif"
        else
            echo -e "${RED}✗${NC} Service $service n'est pas actif"
            exit 1
        fi
    done

    # Vérification de l'interface wlan0
    if ip addr show wlan0 | grep -q "192.168.4.1"; then
        echo -e "${GREEN}✓${NC} Interface wlan0 configurée correctement"
    else
        echo -e "${RED}✗${NC} Interface wlan0 mal configurée"
        exit 1
    fi

    # Test du DHCP
    if dnsmasq --test > /dev/null; then
        echo -e "${GREEN}✓${NC} Configuration DHCP valide"
    else
        echo -e "${RED}✗${NC} Erreur dans la configuration DHCP"
        exit 1
    fi
}

check_node_network() {
    echo "Test de la configuration réseau du node..."
    
    # Vérification de la connexion WiFi
    if iwconfig wlan0 | grep -q "CamillaDSP-Network"; then
        echo -e "${GREEN}✓${NC} Connecté au réseau CamillaDSP"
    else
        echo -e "${RED}✗${NC} Non connecté au réseau CamillaDSP"
        exit 1
    fi

    # Vérification de l'adresse IP
    if ip addr show wlan0 | grep -q "192.168.4"; then
        echo -e "${GREEN}✓${NC} Adresse IP dans la plage correcte"
    else
        echo -e "${RED}✗${NC} Adresse IP hors plage"
        exit 1
    fi

    # Test de connectivité avec le maître
    if ping -c 1 192.168.4.1 > /dev/null; then
        echo -e "${GREEN}✓${NC} Connectivité avec le maître OK"
    else
        echo -e "${RED}✗${NC} Pas de connectivité avec le maître"
        exit 1
    fi
}

# Détection automatique du type de machine
if hostapd --version > /dev/null 2>&1; then
    echo "Machine détectée : Maître"
    check_master_network
else
    echo "Machine détectée : Node"
    check_node_network
fi

echo "Tests réseau terminés."