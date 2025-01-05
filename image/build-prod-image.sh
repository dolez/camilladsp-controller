docker run --platform=linux/amd64 --privileged \
  -v $(pwd)/output:/output \
  -v camilladsp-build:/build \
  -v $(pwd)/create-prod-image.sh:/workdir/create-prod-image.sh \
  -v $(pwd)/create-base-image.sh:/workdir/create-base-image.sh \
  -v $(pwd)/overlays:/workdir/overlays \
  -e WIFI_SSID="ORBI-78" \
  -e WIFI_PSK="chummyzoo238" \
  rpi-image-builder /workdir/create-prod-image.sh