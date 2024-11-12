#!/bin/bash


set -e

# Variables
IMAGES_DIR="./dist"

# Fonction d'aide
usage() {
    echo "Usage: $0 [master|node] [device]"
    echo "Example: $0 master /dev/sdX"
    exit 1
}

# Vérification des arguments
if [ $# -ne 2 ]; then
    usage
fi

TYPE=$1
DEVICE=$2

# Vérification du type
if [[ ! "$TYPE" =~ ^(master|node)$ ]]; then
    echo "Type invalide. Utilisez 'master' ou 'node'"
    exit 1
fi

# Recherche de la dernière image
IMAGE=$(ls -t ${IMAGES_DIR}/camilladsp-${TYPE}-*.zip | head -n1)
if [ -z "$IMAGE" ]; then
    echo "Aucune image trouvée pour le type ${TYPE}"
    exit 1
fi

# Vérification du périphérique
if [ ! -b "$DEVICE" ]; then
    echo "Périphérique invalide: $DEVICE"
    exit 1
fi

echo "🔍 Image sélectionnée: $IMAGE"
echo "💾 Périphérique cible: $DEVICE"
echo "⚠️  ATTENTION: Toutes les données sur $DEVICE seront effacées!"
read -p "Continuer? (o/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "📦 Décompression de l'image..."
    TMP_DIR=$(mktemp -d)
    unzip -q "$IMAGE" -d "$TMP_DIR"
    
    echo "💿 Flashage de l'image..."
    sudo dd bs=4M if="${TMP_DIR}"/*.img of="$DEVICE" status=progress conv=fsync
    
    echo "🧹 Nettoyage..."
    rm -rf "$TMP_DIR"
    
    echo "✅ Image flashée avec succès!"
else
    echo "❌ Opération annulée"
fi