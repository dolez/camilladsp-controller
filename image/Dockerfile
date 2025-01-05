FROM debian:bookworm-slim

# Installation des outils minimums pour créer l'image
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        wget \
        ca-certificates \
        xz-utils \
        kpartx \
        util-linux \
        dosfstools \
        parted \
        e2fsprogs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Répertoires de travail
WORKDIR /workdir
RUN mkdir -p /output /build

# Volume pour stocker l'image de base
VOLUME ["/build"]
VOLUME ["/output"]

# Définir l'entrée par défaut
ENTRYPOINT ["/bin/bash"]
CMD ["/workdir/create-dev-image.sh"]