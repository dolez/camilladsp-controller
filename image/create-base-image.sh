#!/bin/bash
set -e

# Variables communes
BASE_IMAGE_URL="https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2024-11-19/2024-11-19-raspios-bookworm-arm64-lite.img.xz"
BASE_IMAGE_XZ="/build/base.img.xz"
BASE_IMAGE="/build/base.img"

# Configuration par défaut
DEFAULT_USER="mfh"
DEFAULT_PASSWORD="mfh"
STANDARD_HOSTNAME="rpi-audio"
DEV_HOSTNAME="rpi-dev"
SSH_KEY_PATH="$HOME/.ssh/id_rsa.pub"

# Fonction de gestion des erreurs
handle_error() {
    echo "❌ Erreur à la ligne $1"
    cleanup
    exit 1
}
trap 'handle_error $LINENO' ERR

SSH_KEY_PATH="/workdir/id_rsa.pub"

setup_ssh_key() {
    if [ ! -f "$SSH_KEY_PATH" ]; then
        echo "❌ Clé SSH non trouvée dans $SSH_KEY_PATH"
        exit 1
    fi

    mkdir -p /mnt/root/home/$DEFAULT_USER/.ssh
    cat "$SSH_KEY_PATH" >> /mnt/root/home/$DEFAULT_USER/.ssh/authorized_keys
    chmod 700 /mnt/root/home/$DEFAULT_USER/.ssh
    chmod 600 /mnt/root/home/$DEFAULT_USER/.ssh/authorized_keys
    chown -R 1000:1000 /mnt/root/home/$DEFAULT_USER/.ssh
}

create_base_image() {
    local IMAGE_NAME=$1
    local IMAGE_SIZE=$2
    local TYPE=$3

    if [ -f "$BASE_IMAGE" ]; then
        echo "✅ Image de base existante trouvée"
    elif [ -f "$BASE_IMAGE_XZ" ]; then
        echo "📦 Décompression de l'archive de base..."
        xz -d "$BASE_IMAGE_XZ"
    else
        echo "📥 Téléchargement de l'image de base..."
        wget -O "$BASE_IMAGE_XZ" "$BASE_IMAGE_URL"
        xz -d "$BASE_IMAGE_XZ"
    fi

    cp "$BASE_IMAGE" "$IMAGE_NAME"

    # Calcul taille optimale pour la prod
    if [ "$TYPE" = "standard" ]; then
        echo "📏 Calcul de la taille optimale pour la production..."
        ROOT_SIZE=$(du -sm /mnt/root | cut -f1)
        BOOT_SIZE=$(du -sm /mnt/boot | cut -f1)
        MARGIN=50  # 50MB de marge
        TOTAL_SIZE=$((ROOT_SIZE + BOOT_SIZE + MARGIN))
        truncate -s ${TOTAL_SIZE}M "$IMAGE_NAME"
    else
        echo "💾 Allocation de l'espace pour l'image de développement..."
        NEW_SIZE=$((IMAGE_SIZE*1024*1024))
        truncate -s $NEW_SIZE "$IMAGE_NAME"
    fi

    echo "💿 Configuration des partitions..."
    parted "$IMAGE_NAME" resizepart 2 100%

    LOOP_DEV=$(kpartx -av "$IMAGE_NAME" | sed -n 's/add map \(loop[0-9]*\)p.*/\1/p' | head -n1)
    if [ -z "$LOOP_DEV" ]; then
        echo "❌ Erreur: impossible de créer les mappings de partition"
        exit 1
    fi

    e2fsck -f -y /dev/mapper/${LOOP_DEV}p2
    resize2fs /dev/mapper/${LOOP_DEV}p2

    mkdir -p /mnt/boot /mnt/root
    mount /dev/mapper/${LOOP_DEV}p1 /mnt/boot
    mount /dev/mapper/${LOOP_DEV}p2 /mnt/root
}

configure_base() {
    local is_dev=$1
    local hostname=$2

    echo "📦 Application des overlays..."
    if [ -d "/workdir/overlays/common" ]; then
        cp -r /workdir/overlays/common/* /mnt/root/
    fi
    if [ -d "/workdir/overlays/wm8960" ]; then
        cp -r /workdir/overlays/wm8960/* /mnt/root/
    fi

    echo "⚙️ Configuration du boot..."
cat > /mnt/boot/config.txt << EOF
[all]
# UART et USB
dtoverlay=dwc2
enable_uart=1
dtoverlay=disable-bt

# Audio
dtoverlay=wm8960
dtoverlay=i2s-mmap
dtoverlay=wm8960-soundcard

# HDMI
hdmi_safe=1
hdmi_force_hotplug=1
hdmi_drive=2
config_hdmi_boost=4
disable_overscan=1
EOF

    # Configuration USB gadget et console
    PARTUUID=$(blkid -s PARTUUID -o value /dev/mapper/${LOOP_DEV}p2)
echo "console=ttyGS0,115200 console=tty1 root=PARTUUID=${PARTUUID} rootfstype=ext4 fsck.repair=yes rootwait modules-load=dwc2,g_serial" > /mnt/boot/cmdline.txt
    echo "$hostname" > /mnt/root/etc/hostname
    sed -i "s/^127.0.1.1.*$/127.0.1.1\t${hostname}/" /mnt/root/etc/hosts
    touch /mnt/boot/ssh
    touch /mnt/boot/noexpand
    setup_ssh_key

    # Préparation chroot
    mount --bind /proc /mnt/root/proc
    mount --bind /sys /mnt/root/sys
    mount --bind /dev /mnt/root/dev
    mount --bind /dev/pts /mnt/root/dev/pts
}

setup_wifi() {
    cat > /mnt/root/etc/NetworkManager/system-connections/${WIFI_SSID}.nmconnection << EOF
[connection]
id=${WIFI_SSID}
type=wifi
interface-name=wlan0
autoconnect=true
permissions=

[wifi]
mode=infrastructure
ssid=${WIFI_SSID}

[wifi-security]
auth-alg=open
key-mgmt=wpa-psk
psk=${WIFI_PSK}

[ipv4]
method=auto

[ipv6]
addr-gen-mode=default
method=auto
EOF
    chmod 600 /mnt/root/etc/NetworkManager/system-connections/${WIFI_SSID}.nmconnection
}

setup_common() {
    # Vérifie que les variables requises sont définies
    if [ -z "${DEFAULT_USER}" ] || [ -z "${DEFAULT_PASSWORD}" ]; then
        echo "❌ Erreur: DEFAULT_USER et DEFAULT_PASSWORD doivent être définis"
        exit 1
    fi

    cat > /mnt/root/tmp/config << EOF
DEFAULT_USER=${DEFAULT_USER}
DEFAULT_PASSWORD=${DEFAULT_PASSWORD}
EOF

    cat > /mnt/root/tmp/common.sh << 'EOF'
#!/bin/bash
set -e

# Charge les variables de configuration
source /tmp/config

export DEBIAN_FRONTEND=noninteractive

echo "🔧 Configuration de l'utilisateur..."
# Pas de recréation de pi qui existe déjà on set le mot de passe
useradd -m -s /bin/bash "$DEFAULT_USER"
echo "$DEFAULT_USER:$DEFAULT_PASSWORD" | chpasswd
usermod -aG sudo,audio,netdev,i2c "$DEFAULT_USER"
echo "🔧 Configuration des droits sudo..."
echo "$DEFAULT_USER ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$DEFAULT_USER
chmod 440 /etc/sudoers.d/$DEFAULT_USER

echo "📦 Installation des paquets de base..."
apt-get update
apt-get install -y --no-install-recommends \
    libasound2 alsa-utils \
    network-manager dnsmasq hostapd avahi-daemon \
    i2c-tools openssh-server

echo "📦 Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get update
apt-get install -y nodejs
npm install -g pm2

echo "🔊 Configuration audio..."
echo "snd-aloop" >> /etc/modules
echo "snd-wm8960-soundcard" >> /etc/modules

echo "🔊 Configuration console..."
echo "dwc2" >> /etc/modules
echo "g_serial" >> /etc/modules

echo "🌐 Configuration services essentiels..."
systemctl enable wifi-regdom.service
systemctl enable ssh
systemctl enable NetworkManager
systemctl enable avahi-daemon

echo "🎯 Configuration du mode console..."
# Désactiver proprement userconfig
systemctl disable userconfig.service
rm -f /etc/systemd/system/multi-user.target.wants/userconfig.service
rm -f /usr/lib/userconf-pi/userconf-service
systemctl daemon-reload

# Configurer le mode multi-user
systemctl set-default multi-user.target
systemctl enable getty@tty1.service
systemctl enable serial-getty@ttyGS0.service

echo "💀 Désactivation des services firstboot..."
systemctl disable rpi-eeprom-update.service


echo "💀 Désactivation des services de redimensionnement..."
update-rc.d resize2fs_once remove 
rm -f /etc/init.d/resize2fs_once

EOF

    chmod +x /mnt/root/tmp/common.sh
    chroot /mnt/root /tmp/common.sh
    rm /mnt/root/tmp/common.sh

    rm -f /mnt/root/tmp/config
}

setup_standard_image() {
    setup_common

    cat > /mnt/root/tmp/setup.sh << EOF
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "🧹 Nettoyage..."
apt-get purge -y \
    man-db manpages \
    python* perl* \
    apt-listchanges \
    installation-report \
    gcc* g++* cpp* \
    build-essential make cmake \
    debian-faq doc* info* \
    tasksel* \
    plymouth* \
    rsyslog

echo "🗑️ Suppression des locales inutiles..."
rm -rf /usr/share/locale/!(fr|en)*

echo "🗑️ Nettoyage agressif..."
rm -rf /var/log/*
rm -rf /var/cache/apt/*
rm -rf /var/lib/apt/lists/*
rm -rf /var/cache/debconf/*
rm -rf /usr/share/doc/*
rm -rf /usr/share/man/*
rm -rf /usr/share/info/*
rm -rf /var/lib/dhcp/*
rm -rf /usr/share/common-licenses/*

echo "💀 Désactivation du swap..."
systemctl disable dphys-swapfile.service
rm -f /var/swap

echo "💀 Optimisation pour la compression..."
dd if=/dev/zero of=/zero.fill bs=1M || true
rm -f /zero.fill
EOF

    chmod +x /mnt/root/tmp/setup.sh
    chroot /mnt/root /tmp/setup.sh
    rm /mnt/root/tmp/setup.sh
}

setup_dev_image() {
    setup_common

    cat > /mnt/root/tmp/setup.sh << EOF
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

echo "📦 Installation paquets dev..."
apt-get update
apt-get install -y --no-install-recommends \
    cargo rustc build-essential \
    git cmake pkg-config \
    gcc g++ make autoconf libtool \
    libssl-dev \
    vim htop tmux curl screen \
    lsof usbutils net-tools iotop

echo "🔧 Préparation environnement dev..."
mkdir -p /home/\${DEFAULT_USER}/src
chown -R 1000:1000 /home/\${DEFAULT_USER}/src
sed -i 's/^# %sudo ALL=(ALL:ALL) ALL$/%sudo ALL=(ALL:ALL) ALL/' /etc/sudoers

echo "🗑️ Nettoyage minimal..."
apt-get clean

# Liste des services activés pour vérification
echo "📋 Services activés :"
systemctl list-unit-files | grep enabled
EOF

    chmod +x /mnt/root/tmp/setup.sh
    chroot /mnt/root /tmp/setup.sh
    rm /mnt/root/tmp/setup.sh
}

cleanup() {
    echo "💿 Démontage des partitions..."
    umount /mnt/root/dev/pts 2>/dev/null || true
    umount /mnt/root/dev 2>/dev/null || true
    umount /mnt/root/sys 2>/dev/null || true
    umount /mnt/root/proc 2>/dev/null || true
    umount /mnt/root 2>/dev/null || true
    umount /mnt/boot 2>/dev/null || true
    kpartx -d /dev/$(echo $LOOP_DEV) 2>/dev/null || true
}

main() {
    local TYPE=$1
    local SIZE=$2
    local HOSTNAME
    local IMAGE_NAME

    case $TYPE in
        "standard")
            IMAGE_NAME="camilla-standard.img"
            HOSTNAME=$STANDARD_HOSTNAME
            ;;
        "dev")
            IMAGE_NAME="camilla-dev.img"
            HOSTNAME=$DEV_HOSTNAME
            ;;
        *)
            echo "Usage: $0 [standard|dev] size_in_mb"
            exit 1
            ;;
    esac

    create_base_image "$IMAGE_NAME" "$SIZE" "$TYPE"
    configure_base "$TYPE" "$HOSTNAME"
    setup_wifi
    
    if [ "$TYPE" = "standard" ]; then
        setup_standard_image
    else
        setup_dev_image
    fi

    cleanup

    # Copie l'image finale vers le dossier output
    echo "📦 Copie de l'image vers le dossier de sortie..."
    cp "$IMAGE_NAME" /output/
    
    echo "✅ Image $TYPE générée: /output/$IMAGE_NAME"
}