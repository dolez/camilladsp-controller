#!/bin/bash

usage() {
    echo "Usage: $0 [network|nodes|logs|health]"
    echo "  network  - Affiche l'état du réseau"
    echo "  nodes    - Affiche l'état des nodes"
    echo "  logs     - Affiche les logs système"
    echo "  health   - Vérifie l'état du système"
    exit 1
}

check_network() {
    echo "=== État du Réseau ==="
    
    if [ -f /etc/hostapd/hostapd.conf ]; then
        # Master
        echo "Mode: Master"
        echo "--- Services ---"
        systemctl status hostapd --no-pager | grep Active
        systemctl status dnsmasq --no-pager | grep Active
        
        echo -e "\n--- Clients Connectés ---"
        iw dev wlan0 station dump | grep Station
        
        echo -e "\n--- Interface WiFi ---"
        iwconfig wlan0
    else
        # Node
        echo "Mode: Node"
        echo "--- Connexion WiFi ---"
        iwconfig wlan0
        
        echo -e "\n--- Configuration IP ---"
        ip addr show wlan0
        
        echo -e "\n--- Connectivité Master ---"
        ping -c 1 192.168.4.1 > /dev/null && echo "Master accessible" || echo "Master inaccessible"
    fi
}

check_nodes() {
    if [ -f /etc/hostapd/hostapd.conf ]; then
        echo "=== État des Nodes ==="
        # Appel à l'API du master pour récupérer l'état des nodes
        curl -s http://localhost/api/nodes | jq '.'
    else
        echo "Cette commande n'est disponible que sur le master"
        exit 1
    fi
}

show_logs() {
    echo "=== Logs Système ==="
    
    if [ -f /etc/hostapd/hostapd.conf ]; then
        # Logs master
        journalctl -u camilladsp-master -n 50 --no-pager
    else
        # Logs node
        journalctl -u camilladsp-node -n 50 --no-pager
    fi
}

check_health() {
    echo "=== Vérification Santé Système ==="
    
    echo "--- Utilisation CPU ---"
    top -bn1 | head -n 3
    
    echo -e "\n--- Mémoire ---"
    free -h
    
    echo -e "\n--- Espace Disque ---"
    df -h /
    
    echo -e "\n--- Température CPU ---"
    /opt/vc/bin/vcgencmd measure_temp
    
    echo -e "\n--- Services ---"
    if [ -f /etc/hostapd/hostapd.conf ]; then
        systemctl status camilladsp-master --no-pager | grep Active
    else
        systemctl status camilladsp-node --no-pager | grep Active
    fi
}

main() {
    [ $# -eq 1 ] || usage
    
    case "$1" in
        network)
            check_network
            ;;
        nodes)
            check_nodes
            ;;
        logs)
            show_logs
            ;;
        health)
            check_health
            ;;
        *)
            usage
            ;;
    esac
}

main "$@"