#!/bin/bash
set -e

DIETPI_URL="https://dietpi.com/downloads/images/DietPi_RPi-ARMv7-Bookworm.img.xz"
CACHE_DIR="/cache"
OUTPUT_DIR="/output"
BASE_IMAGE="dietpi_base.img"

echo "🚀 Préparation de l'image DietPi optimisée..."

# Gestion du cache de l'image
if [ ! -f "${CACHE_DIR}/${BASE_IMAGE}" ]; then
    wget -O "${CACHE_DIR}/dietpi.img.xz" "${DIETPI_URL}"
    xz -d "${CACHE_DIR}/dietpi.img.xz"
    mv "${CACHE_DIR}/dietpi.img" "${CACHE_DIR}/${BASE_IMAGE}"
fi

# Copie de l'image de travail
cp "${CACHE_DIR}/${BASE_IMAGE}" "/build/${BASE_IMAGE}"

# Montage de l'image
# Montage de l'image
losetup -f "/build/${BASE_IMAGE}"
LOOP_DEV=$(losetup -j "/build/${BASE_IMAGE}" | cut -d: -f1)
echo "Loop device is: ${LOOP_DEV}"

kpartx -av "${LOOP_DEV}"


mkdir -p /mnt/dietpi_boot /mnt/dietpi_root
mount "/dev/mapper/$(basename ${LOOP_DEV})p1" /mnt/dietpi_boot
mount "/dev/mapper/$(basename ${LOOP_DEV})p2" /mnt/dietpi_root

# Configuration DietPi optimisée
cat > /mnt/dietpi_boot/dietpi.txt << EOF
AUTO_SETUP_LOCALE=fr_FR.UTF-8
AUTO_SETUP_KEYBOARD_LAYOUT=fr
AUTO_SETUP_TIMEZONE=Europe/Paris
AUTO_SETUP_NET_ETHERNET_ENABLED=0
AUTO_SETUP_NET_WIFI_ENABLED=1
AUTO_SETUP_NET_WIFI_COUNTRY_CODE=FR
AUTO_SETUP_AUTOMATED=1
AUTO_SETUP_HEADLESS=1
CONFIG_SERIAL_CONSOLE_ENABLE=1
CONFIG_SOUNDCARD=wm8960-soundcard
CONFIG_BOOT_WAIT_FOR_NETWORK=2
CONFIG_CPU_GOVERNOR=conservative
CONFIG_CPU_USAGE_THROTTLE_UP=50
CONFIG_RAM_ARMCPU=240M
CONFIG_RAM_GPU=0
AUTO_SETUP_SWAPFILE_SIZE=0
CONFIG_APT_DISABLE_RECOMMENDS=1
CONFIG_APT_DISABLE_SUGGESTS=1
EOF

# Configuration RPi optimisée
cat > /mnt/dietpi_boot/config.txt << EOF
[pi0w2]
gpu_mem=0
dtoverlay=disable-bt
dtoverlay=dwc2
dtoverlay=wm8960
dtoverlay=i2s-mmap
dtoverlay=wm8960-soundcard
disable_splash=1
disable_camera=1
hdmi_blanking=2
hdmi_force_hotplug=0
dtparam=audio=off
total_mem=512
EOF

# Configuration de la console série USB
sed -i 's/console=tty1/console=ttyGS0,115200 console=tty1/' /mnt/dietpi_boot/cmdline.txt
echo "modules-load=dwc2,g_serial" >> /mnt/dietpi_boot/cmdline.txt

# Configuration APT pour limiter les installations
cat > /mnt/dietpi_root/etc/apt/apt.conf.d/99norecommends << EOF
APT::Install-Recommends "false";
APT::Install-Suggests "false";
APT::AutoRemove::RecommendsImportant "false";
APT::AutoRemove::SuggestsImportant "false";
EOF

# Préparation des répertoires
mkdir -p /mnt/dietpi_root/etc/nginx/sites-enabled
mkdir -p /mnt/dietpi_root/usr/local/bin

# Copie des overlays
cp -r /overlays/nginx/* /mnt/dietpi_root/etc/nginx/
cp -r /overlays/scripts/* /mnt/dietpi_root/usr/local/bin/
chmod +x /mnt/dietpi_root/usr/local/bin/*

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
    
    # Nettoyage initial des paquets non nécessaires
    apt-get -y --purge remove triggerhappy bluetooth bluez
    
    # Installation de tous les paquets nécessaires
    apt-get install -y --no-install-recommends \
        alsa-utils \
        network-manager \
        avahi-daemon \
        nginx-light \
        websocketd \
        fcgiwrap \
        curl \
        jq
    
    # Configuration des modules
    echo 'snd-wm8960-soundcard' >> /etc/modules
    echo 'snd-aloop' >> /etc/modules
    echo 'dwc2' >> /etc/modules
    echo 'g_serial' >> /etc/modules
    
    # Configuration initiale de NetworkManager
    cat > /etc/NetworkManager/system-connections/CamillaDSP.nmconnection << EOL
[connection]
id=CamillaDSP
type=wifi
interface-name=wlan0
permissions=

[wifi]
mode=infrastructure
ssid=${WIFI_SSID:-CamillaDSP}

[wifi-security]
auth-alg=open
key-mgmt=wpa-psk
psk=${WIFI_PSK:-camilladsp}

[ipv4]
method=auto

[ipv6]
addr-gen-mode=default
method=auto
EOL
    chmod 600 /etc/NetworkManager/system-connections/CamillaDSP.nmconnection

    # Activation des services essentiels
    systemctl enable serial-getty@ttyGS0.service
    systemctl enable nginx
    systemctl enable avahi-daemon
    systemctl enable fcgiwrap
    systemctl enable NetworkManager
    
    # Désactivation des services non nécessaires
    systemctl disable bluetooth.service
    systemctl disable triggerhappy.service
    systemctl disable systemd-timesyncd.service
    systemctl disable apt-daily.timer
    systemctl disable apt-daily-upgrade.timer
    
    # Nettoyage agressif
    apt-get -y --purge remove gpgv gnupg
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
umount /mnt/dietpi_boot || true
umount /mnt/dietpi_root || true

# Get loop base name before detaching
LOOP_BASE=$(basename ${LOOP_DEV})

# Perform filesystem operations
echo "📏 Optimisation de la taille..."

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
truncate -s "${NEW_SIZE}" "/build/${BASE_IMAGE}"

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