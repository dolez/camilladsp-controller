#!/bin/bash

set -e

# Variables
PIGEN_DIR="pi-gen"
WORK_DIR="$(pwd)/image-build"
BUILD_VERSION=$(date +"%Y.%m.%d")
GIT_HASH=$(git rev-parse --short HEAD)

# Configuration pour les deux types d'images
declare -A CONFIG_TYPES=(
    ["master"]="master-config"
    ["node"]="node-config"
)

setup_pigen() {
    echo "🔧 Préparation de l'environnement pi-gen..."
    
    # Clone pi-gen si nécessaire
    if [ ! -d "$PIGEN_DIR" ]; then
        git clone https://github.com/RPi-Distro/pi-gen.git "$PIGEN_DIR"
    fi

    # Mise à jour pi-gen
    cd "$PIGEN_DIR"
    git pull
    cd ..
}

create_custom_stage() {
    local type=$1
    local stage_dir="$PIGEN_DIR/stage-camilladsp-${type}"
    
    echo "🔨 Création du stage personnalisé pour ${type}..."
    
    # Création de la structure du stage
    mkdir -p "${stage_dir}"/{00-install-deps,01-network,02-app}

    # Scripts d'installation des dépendances
    cat > "${stage_dir}/00-install-deps/00-run.sh" << 'EOL'
#!/bin/bash -e
install_nodejs() {
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
}

install_wifi_tools() {
    apt-get update
    apt-get install -y hostapd dnsmasq
}

on_chroot << EOF
    install_nodejs
    install_wifi_tools
EOF
EOL

    # Configuration réseau spécifique au type
    if [ "$type" == "master" ]; then
        cp ../scripts/network/setup-master-network.sh "${stage_dir}/01-network/00-run.sh"
    else
        cp ../scripts/network/setup-node-network.sh "${stage_dir}/01-network/00-run.sh"
    fi
    
    # Installation de l'application
    mkdir -p "${stage_dir}/02-app/files"
    
    if [ "$type" == "master" ]; then
        # Copie du code master
        cp -r ../master "${stage_dir}/02-app/files/"
        
        cat > "${stage_dir}/02-app/00-run.sh" << 'EOL'
#!/bin/bash -e
APP_DIR=/opt/camilladsp-controller

on_chroot << EOF
    # Installation de l'application
    mkdir -p ${APP_DIR}
    cp -r /tmp/files/master ${APP_DIR}/
    
    # Installation des dépendances et build
    cd ${APP_DIR}/master/backend
    npm install --production
    cd ${APP_DIR}/master/frontend
    npm install
    npm run build
    mv build ${APP_DIR}/master/backend/static
    
    # Service systemd
    cat > /etc/systemd/system/camilladsp-master.service << EEOF
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
EEOF

    systemctl enable camilladsp-master
EOF
EOL
    else
        # Copie du code node
        cp -r ../node-client "${stage_dir}/02-app/files/"
        
        cat > "${stage_dir}/02-app/00-run.sh" << 'EOL'
#!/bin/bash -e
APP_DIR=/opt/camilladsp-controller

on_chroot << EOF
    # Installation de l'application
    mkdir -p ${APP_DIR}
    cp -r /tmp/files/node-client ${APP_DIR}/
    
    # Installation des dépendances
    cd ${APP_DIR}/node-client
    npm install --production
    
    # Service systemd
    cat > /etc/systemd/system/camilladsp-node.service << EEOF
[Unit]
Description=CamillaDSP Node Client
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/node-client
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EEOF

    systemctl enable camilladsp-node
EOF
EOL
    fi
    
    chmod +x "${stage_dir}"/*/00-run.sh
}

generate_config() {
    local type=$1
    local config_file="$WORK_DIR/${CONFIG_TYPES[$type]}"
    
    echo "📝 Génération de la configuration pour ${type}..."
    
    cat > "$config_file" << EOL
IMG_NAME=camilladsp-${type}
RELEASE=bullseye
DEPLOY_ZIP=1
LOCALE_DEFAULT=fr_FR.UTF-8
TARGET_HOSTNAME=camilladsp-${type}
KEYBOARD_KEYMAP=fr
KEYBOARD_LAYOUT="French - French"
TIMEZONE_DEFAULT=Europe/Paris
ENABLE_SSH=1
STAGE_LIST="stage0 stage1 stage2 stage-camilladsp-${type}"
EOL

    echo "Configuration générée: $config_file"
}

build_image() {
    local type=$1
    echo "🚀 Construction de l'image ${type}..."
    
    cd "$PIGEN_DIR"
    
    # Configuration de l'environnement
    config_file="../$WORK_DIR/${CONFIG_TYPES[$type]}"
    
    # Construction de l'image
    sudo CLEAN=1 ./build.sh -c "$config_file"
    
    # Déplacement des artifacts
    mkdir -p "../dist"
    mv "deploy/*.zip" "../dist/camilladsp-${type}-${BUILD_VERSION}-${GIT_HASH}.zip"
    
    cd ..
}

main() {
    # Création des répertoires de travail
    mkdir -p "$WORK_DIR" "dist"
    
    # Configuration de base
    setup_pigen
    
    # Pour chaque type d'image
    for type in "${!CONFIG_TYPES[@]}"; do
        echo "🎯 Préparation de l'image ${type}..."
        create_custom_stage "$type"
        generate_config "$type"
        build_image "$type"
    done
    
    echo "✨ Construction des images terminée!"
    echo "📦 Images disponibles dans le dossier dist/"
}

# Exécution
main