#!/bin/bash
set -e

usage() {
    echo "Usage: $0 <backup_file>"
    exit 1
}

restore_master() {
    local backup_file=$1
    local temp_dir=$(mktemp -d)
    
    echo "📂 Restauration du backup master..."
    
    # Extraction de l'archive
    tar xzf "${backup_file}" -C "${temp_dir}"
    
    # Arrêt des services
    systemctl stop camilladsp-master hostapd dnsmasq
    
    # Restauration des configurations
    echo "- Configuration réseau..."
    cp "${temp_dir}/hostapd.conf" /etc/hostapd/
    cp "${temp_dir}/dnsmasq.conf" /etc/
    
    echo "- Configuration application..."
    if [ -d "${temp_dir}/app_config" ]; then
        cp -r "${temp_dir}/app_config"/* /opt/camilladsp-controller/master/backend/config/
    fi
    
    echo "- Liste des nodes..."
    if [ -f "${temp_dir}/nodes.json" ]; then
        mkdir -p /opt/camilladsp-controller/master/backend/data
        cp "${temp_dir}/nodes.json" /opt/camilladsp-controller/master/backend/data/
    fi
    
    # Redémarrage des services
    systemctl start hostapd dnsmasq camilladsp-master
    
    # Nettoyage
    rm -rf "${temp_dir}"
    
    echo "✅ Restauration terminée"
}

restore_node() {
    local backup_file=$1
    local temp_dir=$(mktemp -d)
    
    echo "📂 Restauration du backup node..."
    
    # Extraction de l'archive
    tar xzf "${backup_file}" -C "${temp_dir}"
    
    # Arrêt des services
    systemctl stop camilladsp-node
    
    # Restauration des configurations
    echo "- Configuration réseau..."
    cp "${temp_dir}/wpa_supplicant.conf" /etc/wpa_supplicant/
    
    echo "- Configuration CamillaDSP..."
    if [ -d "${temp_dir}/camilladsp" ]; then
        cp -r "${temp_dir}/camilladsp"/* /etc/camilladsp/
    fi
    
    # Redémarrage des services
    systemctl start camilladsp-node
    
    # Nettoyage
    rm -rf "${temp_dir}"
    
    echo "✅ Restauration terminée"
}

main() {
    [ $# -eq 1 ] || usage
    
    local backup_file=$1
    
    # Vérification du fichier de backup
    if [ ! -f "${backup_file}" ]; then
        echo "❌ Fichier de backup introuvable: ${backup_file}"
        exit 1
    fi
    
    # Détection du type de machine
    if [ -f /etc/hostapd/hostapd.conf ]; then
        restore_master "${backup_file}"
    else
        restore_node "${backup_file}"
    fi
}

main "$@"