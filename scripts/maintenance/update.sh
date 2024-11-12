#!/bin/bash
set -e

UPDATE_LOCK="/tmp/camilladsp-update.lock"
LOG_FILE="/var/log/camilladsp-update.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

check_update_lock() {
    if [ -f "${UPDATE_LOCK}" ]; then
        log "Une mise à jour est déjà en cours"
        exit 1
    fi
    touch "${UPDATE_LOCK}"
}

update_system() {
    log "Mise à jour du système..."
    apt-get update
    apt-get upgrade -y
}

update_master() {
    log "Mise à jour du master..."
    
    cd /opt/camilladsp-controller/master
    
    # Sauvegarde de la configuration
    cp -r backend/config backend/config.bak
    
    # Mise à jour du code (à adapter selon votre méthode de déploiement)
    if [ -d ".git" ]; then
        git pull
        
        # Mise à jour backend
        cd backend
        npm install --production
        
        # Mise à jour frontend
        cd ../frontend
        npm install
        npm run build
        rm -rf ../backend/static
        mv build ../backend/static
        
        # Restauration de la configuration
        rm -rf backend/config
        mv backend/config.bak backend/config
    fi
    
    # Redémarrage du service
    systemctl restart camilladsp-master
}

update_node() {
    log "Mise à jour du node..."
    
    cd /opt/camilladsp-controller/node-client
    
    # Sauvegarde de la configuration
    if [ -f "config.json" ]; then
        cp config.json config.json.bak
    fi
    
    # Mise à jour du code
    if [ -d ".git" ]; then
        git pull
        npm install --production
    fi
    
    # Restauration de la configuration
    if [ -f "config.json.bak" ]; then
        mv config.json.bak config.json
    fi
    
    # Redémarrage du service
    systemctl restart camilladsp-node
}

cleanup() {
    rm -f "${UPDATE_LOCK}"
    log "Mise à jour terminée"
}

main() {
    check_update_lock
    trap cleanup EXIT
    
    # Création du fichier de log si nécessaire
    touch "${LOG_FILE}"
    
    log "Démarrage de la mise à jour..."
    
    # Mise à jour système
    update_system
    
    # Détection du type de machine et mise à jour appropriée
    if [ -f /etc/hostapd/hostapd.conf ]; then
        update_master
    else
        update_node
    fi
}

main 