#!/bin/bash

# Vérifie si un argument (hostname) est fourni
if [ -z "$1" ]; then
    echo "Usage: $0 <hostname>"
    echo "Exemple: $0 node1"
    exit 1
fi

NODE_HOST="$1"
NODE_USER="pi"

echo "Déploiement du service CamillaDSP sur $NODE_HOST..."

# Copie le script d'installation
scp scripts/install-camilladsp-service.sh ${NODE_USER}@${NODE_HOST}:~/install-camilladsp-service.sh

# Exécute le script avec sudo
ssh ${NODE_USER}@${NODE_HOST} 'sudo bash ~/install-camilladsp-service.sh'

# Nettoie le script après installation
ssh ${NODE_USER}@${NODE_HOST} 'rm ~/install-camilladsp-service.sh'

echo "Déploiement terminé sur $NODE_HOST" 