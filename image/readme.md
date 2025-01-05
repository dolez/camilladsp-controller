# Construction de l'image Docker
docker build -t rpi-image-builder .

# Génération de l'image RPi (avec configuration WiFi optionnelle)
docker run --privileged -v $(pwd)/output:/output \
  -e WIFI_SSID="votre_ssid" \
  -e WIFI_PSK="votre_password" \
  rpi-image-builder

# L'image sera disponible dans le dossier output/