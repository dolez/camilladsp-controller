#!/bin/bash
set -e

DIETPI_URL="https://dietpi.com/downloads/images/DietPi_RPi-ARMv7-Bookworm.img.xz"
CACHE_DIR="/cache"
OUTPUT_DIR="/output"
BASE_IMAGE="dietpi_base.img"

echo "🚀 Préparation de l'image DietPi optimisée..."

# Gestion du cache de l'image
if [ ! -f "${CACHE_DIR}/${BASE_IMAGE}" ]; then
    echo "📥 Téléchargement de l'image DietPi..."
    wget -O "${CACHE_DIR}/dietpi.img.xz" "${DIETPI_URL}"
    echo "📦 Décompression de l'image..."
    xz -d "${CACHE_DIR}/dietpi.img.xz"
    mv "${CACHE_DIR}/dietpi.img" "${CACHE_DIR}/${BASE_IMAGE}"
fi

echo "📋 Copie de l'image de travail..."
cp "${CACHE_DIR}/${BASE_IMAGE}" "/build/${BASE_IMAGE}"

# Nettoyage complet des périphériques loop
echo "🧹 Nettoyage des périphériques loop..."
losetup -D
sleep 2
losetup -l

# Montage de l'image avec un seul périphérique loop
echo "💿 Montage de l'image..."
LOOP_DEV=$(losetup --show -f "/build/${BASE_IMAGE}")
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

mkdir -p /mnt/dietpi_root/dev
mount --bind /dev /mnt/dietpi_root/dev
mount --bind /dev/pts /mnt/dietpi_root/dev/pts
mount -t proc proc /mnt/dietpi_root/proc
mount -t sysfs sys /mnt/dietpi_root/sys

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
        network-manager \
        avahi-daemon \
        nginx-light \
        curl \
        jq \
        hostapd \
        dnsmasq \
        socat \
        fcgiwrap
    
    # Téléchargement et installation de CamillaDSP
    mkdir -p /opt/camilladsp
    curl -L https://github.com/HEnquist/camilladsp/releases/download/v3.0.0/camilladsp-linux-armv7.tar.gz | tar xz -C /opt/camilladsp
    chmod +x /opt/camilladsp/camilladsp
    ln -s /opt/camilladsp/camilladsp /usr/local/bin/camilladsp
    chmod +x /usr/local/bin/*

    # Activation des services essentiels
    systemctl enable nginx
    systemctl enable avahi-daemon
    systemctl enable NetworkManager
    systemctl enable camilladsp-role.service
    systemctl enable fcgiwrap
    
    # Désactivation des services non nécessaires
    systemctl disable systemd-timesyncd.service
    systemctl disable apt-daily.timer
    systemctl disable apt-daily-upgrade.timer
    
    # Nettoyage agressif
    apt-get -y --purge remove gpgv gnupg triggerhappy bluetooth bluez
    apt-get autoremove -y
    apt-get clean
    rm -rf /var/lib/apt/lists/*
    rm -rf /usr/share/doc
    rm -rf /usr/share/man
    rm -rf /var/cache/apt/*
    rm -rf /var/log/*
    rm -rf /var/tmp/*
    rm -rf /tmp/*
    cd /usr/share/locale && ls | grep -v '^fr\|^en' | xargs rm -rf
"

# Get filesystem info
USED_BLOCKS=$(dumpe2fs -h "/dev/mapper/${LOOP_BASE}p2" | grep "Block count" | awk '{print $3}')
BLOCK_SIZE=$(dumpe2fs -h "/dev/mapper/${LOOP_BASE}p2" | grep "Block size" | awk '{print $3}')
USED_SIZE=$((USED_BLOCKS * BLOCK_SIZE))

# Démontage propre
umount /mnt/dietpi_root/dev/pts || true
umount /mnt/dietpi_root/dev || true
umount /mnt/dietpi_root/proc || true
umount /mnt/dietpi_root/sys || true
umount /mnt/dietpi_boot
umount /mnt/dietpi_root

# Get loop base name before detaching
LOOP_BASE=$(basename ${LOOP_DEV})

# Ajouter une marge de sécurité (par exemple 5%)
MARGIN_SIZE=$((USED_SIZE / 20))
TOTAL_NEEDED_SIZE=$((USED_SIZE + MARGIN_SIZE))

# Effectuer le redimensionnement
echo "📏 Optimisation de la taille..."
e2fsck -f -y "/dev/mapper/${LOOP_BASE}p2"
resize2fs -M "/dev/mapper/${LOOP_BASE}p2"

# Obtenir l'offset de la partition
PART2_START=$(fdisk -l "/build/${BASE_IMAGE}" | grep "${BASE_IMAGE}2" | awk '{print $2}')
PART2_START_BYTES=$((PART2_START * 512))

# Calculer la nouvelle taille totale (début de partition + taille nécessaire)
NEW_SIZE=$((PART2_START_BYTES + TOTAL_NEEDED_SIZE))

# Tronquer l'image
# truncate -s "${NEW_SIZE}" "/build/${BASE_IMAGE}"

# Information sur la taille finale
echo "📊 Taille finale du système de fichiers :"
du -h "/build/${BASE_IMAGE}"

# Get filesystem info
echo "📊 Taille finale du système de fichiers :"
dumpe2fs -h "/dev/mapper/${LOOP_BASE}p2" | grep "Block size\|Block count"

# Then cleanup
kpartx -d "${LOOP_DEV}"
losetup -d "${LOOP_DEV}"

# Compression finale
echo "🗜️ Compression de l'image..."
pigz -9 < "/build/${BASE_IMAGE}" > "${OUTPUT_DIR}/camilladsp-dietpi.img.gz"

echo "✅ Image optimisée générée: ${OUTPUT_DIR}/camilladsp-dietpi.img.gz"