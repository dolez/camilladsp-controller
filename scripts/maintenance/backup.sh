#!/bin/bash
# scripts/maintenance/backup.sh

set -e

BACKUP_DIR="/opt/camilladsp-controller/backups"
CONFIG_DIR="/opt/camilladsp-controller/config"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

# Script de backup
cat > scripts/maintenance/backup.sh << 'EOL'
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/opt/camilladsp-controller/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

backup_master() {
    echo "📦 Création du backup master..."
    
    # Création du répertoire temporaire
    local temp_dir=$(mktemp -d)
    
    # Sauvegarde des configurations
    echo "- Configuration réseau..."
    cp /etc/hostapd/hostapd.conf "${temp_dir}/"
    cp /etc/dnsmasq.conf "${temp_dir}/"
    
    echo "- Configuration application..."
    cp -r /opt/camilladsp-controller/master/backend/config "${temp_dir}/app_config"
    
    echo "- Liste des nodes connus..."
    if [ -f /opt/camilladsp-controller/master/backend/data/nodes.json ]; then
        cp /opt/camilladsp-controller/master/backend/data/nodes.json "${temp_dir}/"
    fi
    
    # Création de l'archive
    tar czf "${BACKUP_FILE}" -C "${temp_dir}" .
    
    # Nettoyage
    rm -rf "${temp_dir}"
    
    echo "✅ Backup créé: ${BACKUP_FILE}"
}

backup_node() {
    echo "📦 Création du backup node..."
    
    local temp_dir=$(mktemp -d)
    
    # Sauvegarde de la configuration réseau
    echo "- Configuration réseau..."
    cp /etc/wpa_supplicant/wpa_supplicant.conf "${temp_dir}/"
    
    # Sauvegarde de la configuration CamillaDSP
    echo "- Configuration CamillaDSP..."
    if [ -d /etc/camilladsp ]; then
        cp -r /etc/camilladsp "${temp_dir}/"
    fi
    
    # Création de l'archive
    tar czf "${BACKUP_FILE}" -C "${temp_dir}" .
    
    # Nettoyage
    rm -rf "${temp_dir}"
    
    echo "✅ Backup créé: ${BACKUP_FILE}"
}

main() {
    # Création du répertoire de backup si nécessaire
    mkdir -p "${BACKUP_DIR}"
    
    # Détection du type de machine
    if [ -f /etc/hostapd/hostapd.conf ]; then
        backup_master
    else
        backup_node
    fi
}

main
EOL
