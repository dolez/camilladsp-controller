#!/bin/bash

# Vérification des privilèges root
if [ "$EUID" -ne 0 ]; then 
  echo "Ce script doit être exécuté en tant que root"
  exit 1
fi

# Installation des dépendances
apt-get update
apt-get install -y avahi-daemon

# Active le démarrage automatique d'Avahi
systemctl enable avahi-daemon

# Création du fichier service Avahi
cat > /etc/avahi/services/camilladsp.service << EOL
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">CamillaDSP on %h</name>
  <service>
    <type>_camilladsp._tcp</type>
    <port>5000</port>
    <txt-record>version=1.0</txt-record>
  </service>
</service-group>
EOL

# Configuration des permissions
chmod 644 /etc/avahi/services/camilladsp.service

# Redémarrage du service Avahi
systemctl restart avahi-daemon

# Vérifie le statut du service
systemctl status avahi-daemon

echo "Installation terminée. Le service CamillaDSP est maintenant publié via Avahi." 