FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    xz-utils \
    kpartx \
    parted \
    dosfstools \
    e2fsprogs \
    zip \
    unzip \
    curl \
    fdisk \
    pigz \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
VOLUME ["/output", "/cache", "/scripts", "/build"]

ENTRYPOINT ["/bin/bash", "/scripts/build-dietpi.sh"]