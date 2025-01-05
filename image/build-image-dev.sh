docker run --platform=linux/amd64 --privileged \
 -v $(pwd)/output:/output \
 -v camilladsp-build:/build \
 -v $(pwd)/create-dev-image.sh:/workdir/create-dev-image.sh \
 -v $(pwd)/create-base-image.sh:/workdir/create-base-image.sh \
 -v $(pwd)/overlays:/workdir/overlays \
 -v ~/.ssh/id_rsa.pub:/workdir/id_rsa.pub \
 -e WIFI_SSID="ORBI-78" \
 -e WIFI_PSK="chummyzoo238" \
 rpi-image-builder /workdir/create-dev-image.sh


 ###
# docker run -it --platform=linux/amd64 --privileged \
#    -v $(pwd)/output:/output \
#    -v camilladsp-build:/build \
#    -v $(pwd)/create-dev-image.sh:/workdir/create-dev-image.sh \
#    -v $(pwd)/create-base-image.sh:/workdir/create-base-image.sh \
#    -v $(pwd)/overlays:/workdir/overlays \
#    -v ~/.ssh/id_rsa.pub:/workdir/id_rsa.pub \
#    -e WIFI_SSID="ORBI-78" \
#    -e WIFI_PSK="chummyzoo238" \
#    --entrypoint="" \
#    rpi-image-builder /bin/bash


