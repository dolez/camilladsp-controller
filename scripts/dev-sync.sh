# scripts/dev-sync.sh
#!/bin/bash

PI_HOST="pi@hotspot"
PI_PATH="/home/pi/camilladsp-controller"

EXCLUDE_PATTERNS=(
    "node_modules/"
    ".git/"
    "logs/"
    "*.log"
)

EXCLUDE=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE="$EXCLUDE --exclude='$pattern'"
done

local_build() {
    echo "🔧 Building for production..."
    NODE_ENV=production npm run build
}

sync_to_pi() {
    eval rsync -avz --delete $EXCLUDE ./ "$PI_HOST:$PI_PATH/"
}

restart_server() {
    ssh $PI_HOST "cd $PI_PATH && NODE_ENV=production pm2 describe server > /dev/null 2>&1; if [ \$? -eq 0 ]; then NODE_ENV=production pm2 restart server --update-env --watch; else NODE_ENV=production pm2 start server.js --name server --watch; fi"
}

setup_pi() {
    echo "🔧 Configuration initiale sur le Pi..."
    # Vérifie que pm2 est installé
    ssh $PI_HOST "command -v pm2 || (echo 'pm2 non trouvé. Installation...' && sudo npm install -g pm2)"
    
    # Crée le dossier et installe les dépendances
    ssh $PI_HOST "mkdir -p $PI_PATH"
    sync_to_pi
    ssh $PI_HOST "cd $PI_PATH && npm install --omit=dev"
    
    echo "✅ Setup terminé"
}

watch_changes() {
    echo "👀 Surveillance des changements..."
    fswatch -o ./src ./server.js | while read f; do
        echo "📦 Changement détecté, build et sync..."
        local_build
        sync_to_pi
        restart_server
    done
}

case "$1" in
    "setup") 
        setup_pi 
        ;;
    "watch")
        watch_changes
        ;;
    "sync")
        local_build
        sync_to_pi
        restart_server
        ;;
    *)
        echo "Usage: $0 {setup|watch|sync}"
        exit 1
        ;;
esac