#!/bin/bash
# Script de déploiement pour le Raspberry Pi maître

set -e

# Variables de configuration
APP_DIR="/opt/camilladsp-controller"
NODE_VERSION="18"

# Installation des dépendances système
install_system_deps() {
    # Mise à jour du système
    apt-get update
    apt-get upgrade -y

    # Installation de Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs

    # Installation des outils de build
    apt-get install -y git build-essential
}

# Configuration du service systemd
setup_service() {
    cat > /etc/systemd/system/camilladsp-master.service << EOL
[Unit]
Description=CamillaDSP Controller Master
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/master/backend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=PORT=80

[Install]
WantedBy=multi-user.target
EOL

    systemctl daemon-reload
    systemctl enable camilladsp-master
}

# Installation de l'application
install_app() {
    # Création du répertoire
    mkdir -p ${APP_DIR}
    cd ${APP_DIR}

    # Copie des fichiers de l'application
    cp -r ./master ${APP_DIR}/

    # Installation des dépendances
    cd ${APP_DIR}/master/backend
    npm install --production

    # Build du frontend
    cd ${APP_DIR}/master/frontend
    npm install
    npm run build

    # Déplacement du build dans le dossier static du backend
    mv build ${APP_DIR}/master/backend/static
}

# Fonction principale
main() {
    echo "Déploiement du contrôleur CamillaDSP..."
    
    install_system_deps
    
    # Configuration du réseau
    bash ./setup-network.sh
    
    install_app
    setup_service
    
    # Démarrage du service
    systemctl start camilladsp-master
    
    echo "Déploiement terminé!"
    echo "Vérifiez les logs avec: journalctl -u camilladsp-master"
}

main