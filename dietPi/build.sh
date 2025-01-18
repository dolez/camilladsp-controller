#!/bin/bash

# Crée les répertoires nécessaires
mkdir -p output cache

# Construction de l'image Docker
docker  build -t dietpi-builder .

# Exécution avec les volumes
docker run --privileged \
    -v "$(pwd)/output:/output" \
    -v "$(pwd)/cache:/cache" \
    -v "$(pwd)/scripts:/scripts" \
    -v "$(pwd)/overlays:/overlays" \
    -v "$(pwd)/build:/build" \
    -e WIFI_SSID="${WIFI_SSID:-CamillaDSP}" \
    -e WIFI_PSK="${WIFI_PSK:-camilladsp}" \
    dietpi-builder