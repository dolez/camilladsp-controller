#!/bin/bash
set -e

DIETPI_URL="https://dietpi.com/downloads/images/DietPi_RPi-ARMv7-Bookworm.img.xz"
CACHE_DIR="/cache"
OUTPUT_DIR="/output"
BASE_IMAGE="${CACHE_DIR}/base/dietpi_base.img"
BUILD_IMAGE="/build/dietpi.img"

echo "🚀 Préparation de l'image DietPi optimisée..."

# Gestion du cache de l'image
if [ ! -f "${BASE_IMAGE}" ]; then
    echo "📥 Téléchargement de l'image DietPi..."
    mkdir -p "$(dirname "${BASE_IMAGE}")"
    wget -O "${CACHE_DIR}/base/dietpi.img.xz" "${DIETPI_URL}"
    echo "📦 Décompression de l'image..."
    xz -d "${CACHE_DIR}/base/dietpi.img.xz"
    mv "${CACHE_DIR}/base/dietpi.img" "${BASE_IMAGE}"
fi

echo "📋 Copie de l'image de travail..."
cp "${BASE_IMAGE}" "${BUILD_IMAGE}"

# Nettoyage complet des périphériques loop
echo "🧹 Nettoyage des périphériques loop..."
losetup -D
sleep 2
losetup -l

# Montage de l'image avec un seul périphérique loop
echo "💿 Montage de l'image..."
LOOP_DEV=$(losetup --show -f "${BUILD_IMAGE}")
echo "Périphérique loop: ${LOOP_DEV}"

# Vérification que le périphérique est bien monté
if ! losetup -l | grep -q "${LOOP_DEV}"; then
    echo "❌ Erreur: Le périphérique loop n'a pas été créé correctement"
    exit 1
fi

# Création des périphériques de partition
echo "🔧 Configuration des partitions..."
kpartx -av "${LOOP_DEV}"
sleep 2

# Récupération du nom de base du périphérique loop
LOOP_BASE=$(basename ${LOOP_DEV})

# Montage des partitions
echo "📁 Montage des partitions..."
mkdir -p /mnt/dietpi_boot /mnt/dietpi_root
mount "/dev/mapper/${LOOP_BASE}p1" /mnt/dietpi_boot
mount "/dev/mapper/${LOOP_BASE}p2" /mnt/dietpi_root

# Configuration de la console série USB
sed -i 's/console=serial0,115200 //' /mnt/dietpi_boot/cmdline.txt
sed -i 's/console=tty1/console=ttyGS0,115200 console=tty1/' /mnt/dietpi_boot/cmdline.txt
echo "modules-load=dwc2,g_serial" >> /mnt/dietpi_boot/cmdline.txt

# Copie des overlays
cp -rp /overlays/root/* /mnt/dietpi_root/
cp -rp /overlays/boot/* /mnt/dietpi_boot/

# Montage des systèmes nécessaires
mkdir -p /mnt/dietpi_root/dev
mount --bind /dev /mnt/dietpi_root/dev
mount --bind /dev/pts /mnt/dietpi_root/dev/pts
mount -t proc proc /mnt/dietpi_root/proc
mount -t sysfs sys /mnt/dietpi_root/sys

# Montage du cache APT
mkdir -p /mnt/dietpi_root/var/cache/apt/archives
mkdir -p "${CACHE_DIR}/apt"
mount --bind "${CACHE_DIR}/apt" /mnt/dietpi_root/var/cache/apt/archives

echo "📦 Installation des paquets et configuration du système..."
chroot /mnt/dietpi_root /bin/bash -c "
    set -x
    
    # Configuration de l'environnement
    export DEBIAN_FRONTEND=noninteractive

    # Mise à jour initiale
    apt-get update
    apt-get install -y gnupg gpgv

    # Installation de tous les paquets nécessaires
    apt-get install -y --no-install-recommends \
        alsa-utils \
        hostapd \
        dnsmasq \
        wpasupplicant \
        avahi-daemon \
        avahi-utils \
        nginx-light \
        curl \
        jq \
        socat \
        fcgiwrap \
        dropbear 

    # Reconfigurer les paquets clavier
    dpkg-reconfigure -f noninteractive keyboard-configuration
    dpkg-reconfigure -f noninteractive console-setup

    # Mettre à jour les paramètres de la console
    setupcon --save-only

    # S'assurer que les services de configuration du clavier sont activés
    systemctl enable keyboard-setup.service
    systemctl enable console-setup.service

    # Forcer la configuration dans /etc/console-setup/cached_setup_keyboard.sh
    sed -i 's/XKBLAYOUT=.*/XKBLAYOUT="fr"/' /etc/console-setup/cached_setup_keyboard.sh

    # Suppression logs nginx
    sed -i 's|error_log /var/log/nginx/error.log.*|error_log /dev/null;|' /etc/nginx/nginx.conf
    sed -i 's|access_log /var/log/nginx/access.log.*|access_log off;|' /etc/nginx/nginx.conf

    # Configuration du mot de passe root et dietpi
    echo "root:camilladsp" | chpasswd
    echo "dietpi:camilladsp" | chpasswd

    # Suppression default nginx
    rm -rf /etc/nginx/sites-enabled/default

    # Téléchargement et installation de CamillaDSP
    mkdir -p /opt/camilladsp
    curl -L https://github.com/HEnquist/camilladsp/releases/download/v3.0.0/camilladsp-linux-armv7.tar.gz | tar xz -C /opt/camilladsp
    chmod +x /opt/camilladsp/camilladsp
    ln -s /opt/camilladsp/camilladsp /usr/local/bin/camilladsp
    chmod +x /usr/local/bin/*

    # Activation des services essentiels
    systemctl disable nginx.service
    systemctl enable camilla-nginx.service
    systemctl enable avahi-daemon.service
    systemctl enable camilladsp-role.service
    systemctl enable fcgiwrap.service
    systemctl enable serial-getty@ttyGS0.service
    systemctl enable dnsmasq.service
    systemctl enable alsa-restore.service
    systemctl enable alsa-store.service
        
    # Désactivation des services non nécessaires
    systemctl disable systemd-timesyncd
    systemctl disable apt-daily.timer
    systemctl disable apt-daily-upgrade.timer
    systemctl disable dietpi-firstboot
    systemctl disable dietpi-cloudshell
    systemctl disable dietpi-fs_partition_resize
    systemctl disable dietpi-postboot
    systemctl disable dietpi-preboot
    systemctl disable dietpi-ramlog
    systemctl disable dietpi-vpn
    systemctl disable dietpi-wifi-monitor
    systemctl disable dietpi-kill_ssh
    systemctl disable dpkg-db-backup.timer
    systemctl disable fstrim.timer
    systemctl disable fake-hwclock
    systemctl disable console-setup
    systemctl disable dietpi-kill_ssh
    systemctl disable dpkg-db-backup.timer
    systemctl disable fstrim.timer
    systemctl disable fake-hwclock.service
    systemctl disable console-setup.service
    systemctl disable serial-getty@serial0.service
    rm -f /etc/systemd/system/getty.target.wants/serial-getty@serial0.service
    rm /etc/systemd/system/dietpi-firstboot.service

    # Configuration de dropbear pour dietpi uniquement
    mkdir -p /etc/dropbear
    # Supprimer les clés existantes avant d'en générer de nouvelles
    rm -f /etc/dropbear/dropbear_*_host_key
    dropbearkey -t rsa -f /etc/dropbear/dropbear_rsa_host_key
    
    # Ajouter dietpi au groupe sudo
    usermod -aG sudo dietpi
    
    # Activer dropbear
    systemctl enable dropbear.service

    # Nettoyage agressif
    apt-get -y --purge remove \
        gpgv \
        gnupg \
        triggerhappy \
        bluetooth \
        bluez \
        dirmngr \
        gpg \
        gpg-agent \
        wget \
        firmware-atheros \
        firmware-iwlwifi \
        firmware-misc-nonfree \

    # Garder uniquement les fichiers essentiels de dropbear
    rm -rf /usr/share/doc/dropbear*

    apt-get autoremove -y
    
    # Démonter le cache APT avant le nettoyage final
    umount /var/cache/apt/archives || true
    
    apt-get clean
    rm -rf /var/lib/apt/lists/*
    rm -rf /usr/share/doc
    rm -rf /usr/share/man
    rm -rf /var/tmp/*
    rm -rf /tmp/*
    cd /usr/share/locale && ls | grep -v '^fr\|^en' | xargs rm -rf
"

# Démontage propre
echo "🔄 Démontage des systèmes de fichiers..."
umount /mnt/dietpi_root/dev/pts || true
umount /mnt/dietpi_root/dev || true
umount /mnt/dietpi_root/proc || true
umount /mnt/dietpi_root/sys || true
umount /mnt/dietpi_boot
umount /mnt/dietpi_root

# Récupérer le nom de base du périphérique loop
LOOP_BASE=$(basename ${LOOP_DEV})

# Constantes pour le redimensionnement
FIXED_MARGIN_MB=100
RPI_ALIGNMENT=$((4 * 1024 * 1024))  # 4MB alignement pour Raspberry Pi

# 1. Vérifier et réparer le système de fichiers
echo "🔍 Vérification du système de fichiers..."
e2fsck -f -y "/dev/mapper/${LOOP_BASE}p2"

# 2. Réduire le système de fichiers au minimum
echo "📏 Réduction du système de fichiers..."
resize2fs -M "/dev/mapper/${LOOP_BASE}p2"

# 3. Obtenir la nouvelle taille exacte du système de fichiers
RESIZED_BLOCKS=$(dumpe2fs -h "/dev/mapper/${LOOP_BASE}p2" | grep "Block count" | awk '{print $3}')
BLOCK_SIZE=$(dumpe2fs -h "/dev/mapper/${LOOP_BASE}p2" | grep "Block size" | awk '{print $3}')
RESIZED_SIZE=$((RESIZED_BLOCKS * BLOCK_SIZE))

# 4. Ajouter la marge et redimensionner à la nouvelle taille
MARGIN_BYTES=$((FIXED_MARGIN_MB * 1024 * 1024))
NEW_FS_SIZE=$((RESIZED_SIZE + MARGIN_BYTES))
echo "📏 Redimensionnement avec marge à $((NEW_FS_SIZE / 1024 / 1024))MB..."
resize2fs "/dev/mapper/${LOOP_BASE}p2" "$((NEW_FS_SIZE / 1024))K"

# 5. Obtenir l'offset de début de la partition 2
PART2_START=$(fdisk -l "${LOOP_DEV}" | grep "${LOOP_DEV}p2" | awk '{print $2}')
PART2_START_BYTES=$((PART2_START * 512))

# 6. Calculer la taille totale nécessaire
NEW_SIZE=$((PART2_START_BYTES + NEW_FS_SIZE))

# 7. Arrondir au multiple de 4MB supérieur pour la compatibilité RPi
NEW_SIZE=$(( (NEW_SIZE + RPI_ALIGNMENT - 1) & ~(RPI_ALIGNMENT - 1) ))

# 8. Détacher les mappings de partition
echo "🔧 Détachement des mappings de partition..."
kpartx -d "${LOOP_DEV}"

# 9. Tronquer l'image
echo "✂️ Troncature de l'image à $(( NEW_SIZE / 1024 / 1024 ))MB..."
truncate -s "${NEW_SIZE}" "${BUILD_IMAGE}"

# 10. Détacher le périphérique loop
echo "🔄 Détachement du périphérique loop..."
losetup -d "${LOOP_DEV}"

# Afficher les informations finales
echo "📊 Taille finale de l'image : $(du -h "${BUILD_IMAGE}" | cut -f1)"

# Compression finale
echo "🗜️ Compression de l'image..."
pigz -9 < "${BUILD_IMAGE}" > "${OUTPUT_DIR}/camilladsp-dietpi.img.gz"

echo "✅ Image optimisée générée: ${OUTPUT_DIR}/camilladsp-dietpi.img.gz"