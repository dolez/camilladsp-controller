#!/bin/bash

# Configuration
DEV_PI="pi@camilladsp-dev.local"
OVERLAY_DIR="image/overlays"
REMOTE_WORKSPACE="/home/pi/src/camilladsp-project"
DEFAULT_PASSWORD="raspberry"

# Fonctions utilitaires
check_connection() {
    echo "🔍 Vérification de la connexion au Pi de dev..."
    
    # Vérifie si la console série est disponible
    if [ -e "/dev/tty.usbmodem104NTMXE51392" ]; then
        echo "Console série détectée, lancement du diagnostic..."
        ./scripts/debug-serial.sh &
        SCREEN_PID=$!
    fi
    
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    echo "Attente de la disponibilité du Raspberry Pi..."
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if ping -c 1 camilladsp-dev.local > /dev/null 2>&1; then
            echo "✅ Raspberry Pi détecté !"
            return 0
        fi
        echo "Tentative $ATTEMPT/$MAX_ATTEMPTS..."
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        echo "❌ Impossible de joindre le Raspberry Pi de dev"
        echo "Vérifiez que :"
        echo "1. La carte SD est bien flashée"
        echo "2. Le Raspberry Pi est alimenté"
        echo "3. Le WiFi est correctement configuré"
        echo "4. Vous êtes sur le même réseau"
        exit 1
    fi
}

first_time_setup() {
    echo "🔧 Première configuration..."
    
    # Attend que SSH soit disponible
    until nc -z camilladsp-dev.local 22 2>/dev/null; do
        echo "En attente du service SSH..."
        sleep 2
    done
    
    # Configure la clé SSH
    echo "📝 Configuration de la clé SSH..."
    if [ ! -f ~/.ssh/id_rsa ]; then
        ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa
    fi
    
    # Copie la clé SSH (avec le mot de passe par défaut)
    sshpass -p "$DEFAULT_PASSWORD" ssh-copy-id -o StrictHostKeyChecking=no $DEV_PI
    
    echo "✅ Configuration SSH terminée"
}

setup_dev_env() {
    # Vérifie si c'est la première connexion
    if ! ssh -o PasswordAuthentication=no $DEV_PI "exit" 2>/dev/null; then
        first_time_setup
    fi
    
    echo "🔧 Configuration de l'environnement de dev..."
    
    # Crée l'arborescence sur le Pi
    ssh $DEV_PI "mkdir -p $REMOTE_WORKSPACE/{src,build}"
    
    # Copie les sources WM8960
    echo "📂 Copie des sources WM8960..."
    scp -r wm8960-src/* $DEV_PI:$REMOTE_WORKSPACE/src/
    
    # Configure l'environnement de build
    ssh $DEV_PI "cd $REMOTE_WORKSPACE && \
        sudo apt-get update && \
        sudo apt-get install -y build-essential raspberrypi-kernel-headers && \
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
    
    echo "✅ Environnement de dev configuré"
}

build_wm8960() {
    echo "🔨 Compilation du module WM8960..."
    ssh $DEV_PI "cd $REMOTE_WORKSPACE/src && make clean && make"
}

build_camilladsp() {
    echo "🔨 Compilation de CamillaDSP..."
    ssh $DEV_PI "source ~/.cargo/env && \
        cargo install camilladsp && \
        cargo install camilladsp-config"
}

sync_from_dev() {
    echo "📥 Récupération des fichiers compilés..."
    
    # Crée les répertoires nécessaires
    mkdir -p $OVERLAY_DIR/{common/usr/local/{lib/wm8960,bin},common/boot/overlays,wm8960/home/pi/camilladsp/configs}
    
    # Récupère le module WM8960
    scp $DEV_PI:$REMOTE_WORKSPACE/src/wm8960.ko $OVERLAY_DIR/common/usr/local/lib/wm8960/
    scp $DEV_PI:$REMOTE_WORKSPACE/src/wm8960-soundcard.dtbo $OVERLAY_DIR/common/boot/overlays/
    
    # Récupère CamillaDSP
    scp $DEV_PI:~/.cargo/bin/camilladsp $OVERLAY_DIR/common/usr/local/bin/
    scp $DEV_PI:~/.cargo/bin/camilladsp-config $OVERLAY_DIR/common/usr/local/bin/
    
    # Récupère les configurations
    scp $DEV_PI:~/camilladsp/configs/default.yml $OVERLAY_DIR/wm8960/home/pi/camilladsp/configs/
}

run_tests() {
    echo "🧪 Exécution des tests..."
    ssh $DEV_PI "cd $REMOTE_WORKSPACE && \
        camilladsp -t configs/default.yml && \
        aplay -l && \
        i2cdetect -y 1"
}

case "$1" in
    "setup")
        check_connection
        setup_dev_env
        ;;
    "build")
        check_connection
        build_wm8960
        build_camilladsp
        ;;
    "sync")
        check_connection
        sync_from_dev
        ;;
    "test")
        check_connection
        run_tests
        ;;
    "all")
        check_connection
        setup_dev_env
        build_wm8960
        build_camilladsp
        sync_from_dev
        run_tests
        ;;
    *)
        echo "Usage: $0 {setup|build|sync|test|all}"
        echo "  setup: Configure l'environnement de développement"
        echo "  build: Compile WM8960 et CamillaDSP"
        echo "  sync:  Récupère les fichiers compilés"
        echo "  test:  Lance les tests sur le Pi"
        echo "  all:   Exécute toutes les étapes"
        exit 1
        ;;
esac 