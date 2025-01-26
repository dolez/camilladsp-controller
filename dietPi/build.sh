#!/bin/bash

# Crée les répertoires nécessaires
mkdir -p output cache/apt cache/base build

# Construction de l'image Docker
docker build -t dietpi-builder .

# Exécution avec les volumes
docker run --rm --privileged \
    -v "$(pwd)/output:/output" \
    -v "$(pwd)/cache:/cache" \
    -v "$(pwd)/scripts:/scripts" \
    -v "$(pwd)/overlays:/overlays" \
    -v "$(pwd)/build:/build" \
    --entrypoint /scripts/build-dietpi.sh \
    dietpi-builder "$@"