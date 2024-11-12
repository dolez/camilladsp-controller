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
    
    if [ ! -d "$PIGEN_DIR" ]; then
        git clone https://github.com/RPi-Distro/pi-gen.git "$PIGEN_DIR"
    fi

    cd "$PIGEN_DIR"
    git pull
    cd ..
}

create_custom_stage() {
    local type=$1
    local stage_dir="$PIGEN_DIR/stage-camilladsp-${type}"
    
    echo "🔨 Création du stage personnalisé pour ${type}..."
    
    # Structure du stage
    mkdir -p "${stage_dir}"/{00-install-deps,01-network,02-app}/files

    # Configuration des dépendances
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

    # Configuration réseau et scripts
    # Configuration réseau et scripts
    mkdir -p "${stage_dir}/01-network/files/opt/camilladsp-controller/scripts/network"

    # Copie de tous les scripts réseau
    cp ../scripts/network/*.sh "${stage_dir}/01-network/files/opt/camilladsp-controller/scripts/network/"

    mkdir -p "${stage_dir}/01-network/files/etc"

    # Configuration réseau spécifique au type
    if [ "$type" == "master" ]; then
        # Copie de la configuration réseau
        cp ../master/backend/config/network.conf "${stage_dir}/01-network/files/etc/camilladsp-network.conf"
        
        # Script de configuration réseau
        cat > "${stage_dir}/01-network/00-run.sh" << 'EOL'
#!/bin/bash -e
on_chroot << EOF
    # Rendre les scripts réseau exécutables
    chmod +x /opt/camilladsp-controller/scripts/network/*.sh

    # Configuration du réseau à partir du fichier de configuration
    source /etc/camilladsp-network.conf
    
    # Exécution du script de configuration master
    /opt/camilladsp-controller/scripts/network/setup-master-network.sh
EOF
EOL
    else
    cat > "${stage_dir}/01-network/00-run.sh" << 'EOL'
#!/bin/bash -e
on_chroot << EOF
    # Rendre les scripts réseau exécutables
    chmod +x /opt/camilladsp-controller/scripts/network/*.sh

    # Exécution du script de configuration node
    /opt/camilladsp-controller/scripts/network/setup-node-network.sh
EOF
EOL
fi

    # Installation de l'application et scripts

    if [ "$type" == "master" ]; then
        # Structure pour le master
        mkdir -p "${stage_dir}/02-app/files/opt/camilladsp-controller"
        cp -r ../master "${stage_dir}/02-app/files/opt/camilladsp-controller/"
        cp -r ../scripts "${stage_dir}/02-app/files/opt/camilladsp-controller/"
        cp ../master/backend/config/systemd/camilladsp-master.service \
           "${stage_dir}/02-app/files/etc/systemd/system/"
        
        cat > "${stage_dir}/02-app/00-run.sh" << 'EOL'
#!/bin/bash -e
APP_DIR=/opt/camilladsp-controller

on_chroot << EOF
    # Configuration des permissions
    chmod +x ${APP_DIR}/scripts/network/*.sh
    chmod +x ${APP_DIR}/scripts/maintenance/*.sh

    # Installation des dépendances et build
    cd ${APP_DIR}/master/backend
    npm install --production
    cd ${APP_DIR}/master/frontend
    npm install
    npm run build
    mv build ${APP_DIR}/master/backend/static

    # Liens symboliques pour les commandes
    ln -sf ${APP_DIR}/scripts/maintenance/monitor.sh /usr/local/bin/camilladsp-monitor
    ln -sf ${APP_DIR}/scripts/maintenance/backup.sh /usr/local/bin/camilladsp-backup
    ln -sf ${APP_DIR}/scripts/maintenance/restore.sh /usr/local/bin/camilladsp-restore
    ln -sf ${APP_DIR}/scripts/maintenance/update.sh /usr/local/bin/camilladsp-update
    ln -sf ${APP_DIR}/scripts/network/test-network.sh /usr/local/bin/camilladsp-network-test

    # Activation du service
    systemctl enable camilladsp-master
EOF
EOL
    else
        # Structure pour le node
        mkdir -p "${stage_dir}/02-app/files/opt/camilladsp-controller"
        cp -r ../node-client "${stage_dir}/02-app/files/opt/camilladsp-controller/"
        cp -r ../scripts "${stage_dir}/02-app/files/opt/camilladsp-controller/"
        cp ../node-client/config/systemd/camilladsp-node.service \
           "${stage_dir}/02-app/files/etc/systemd/system/"
        
        cat > "${stage_dir}/02-app/00-run.sh" << 'EOL'
#!/bin/bash -e
APP_DIR=/opt/camilladsp-controller

on_chroot << EOF
    # Configuration des permissions
    chmod +x ${APP_DIR}/scripts/network/*.sh
    chmod +x ${APP_DIR}/scripts/maintenance/*.sh

    # Installation des dépendances
    cd ${APP_DIR}/node-client
    npm install --production

    # Liens symboliques pour les commandes
    ln -sf ${APP_DIR}/scripts/maintenance/monitor.sh /usr/local/bin/camilladsp-monitor
    ln -sf ${APP_DIR}/scripts/maintenance/backup.sh /usr/local/bin/camilladsp-backup
    ln -sf ${APP_DIR}/scripts/maintenance/restore.sh /usr/local/bin/camilladsp-restore
    ln -sf ${APP_DIR}/scripts/maintenance/update.sh /usr/local/bin/camilladsp-update
    ln -sf ${APP_DIR}/scripts/network/test-network.sh /usr/local/bin/camilladsp-network-test

    # Activation du service
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
    mkdir -p "$WORK_DIR" "dist"
    setup_pigen
    
    for type in "${!CONFIG_TYPES[@]}"; do
        echo "🎯 Préparation de l'image ${type}..."
        create_custom_stage "$type"
        generate_config "$type"
        build_image "$type"
    done
    
    echo "✨ Construction des images terminée!"
    echo "📦 Images disponibles dans le dossier dist/"
}

main