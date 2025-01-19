#!/bin/bash
set -e

NODE_NAME="$NODE_NAME"
UPLOAD_DIR="/tmp/uploads"

# Créer le répertoire si nécessaire
mkdir -p "$UPLOAD_DIR"

# Lire le fichier depuis stdin et le sauvegarder
cat > "$UPLOAD_DIR/$NODE_NAME"

# Ici votre logique post-upload
# Par exemple, déplacer le fichier, le traiter, etc.

echo "Content-type: application/json"
echo ""
echo '{"status":"success"}'