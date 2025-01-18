#!/bin/bash
# Créer un FIFO unique pour ce client
client_fifo="/tmp/client_$$"
mkfifo "$client_fifo"

cleanup() {
    jobs -p | xargs -r kill 2>/dev/null
    rm -f "$client_fifo"
    [ -f "/tmp/distributor.pid" ] && [ "$$" = "$(cat /tmp/distributor.pid)" ] && rm -f "/tmp/distributor.pid"
}
trap cleanup EXIT

# Envoyer les headers
printf "HTTP/1.1 200 OK\r\n"
printf "Content-Type: text/event-stream\r\n"
printf "Cache-Control: no-cache\r\n"
printf "Connection: keep-alive\r\n"
printf "Access-Control-Allow-Origin: *\r\n"
printf "\r\n"

# Distribution en étoile avec gestion robuste du distributeur
if [ ! -f "/tmp/distributor.pid" ] || ! kill -0 "$(cat /tmp/distributor.pid)" 2>/dev/null; then
    {
	echo $$ > "/tmp/distributor.pid"
        setsid bash -c "
            trap 'rm -f /tmp/distributor.pid' EXIT
            while true; do
                # Lecture incrémentale et bloquante sur le FIFO principal
                if IFS= read -r line < \"$1\"; then
                    # Distribuer la ligne à tous les FIFOs clients actifs
                    for f in /tmp/client_*; do
                        if [ -p \"\$f\" ]; then
                            echo \"\$line\" > \"\$f\" 2>/dev/null || rm -f \"\$f\"  # Nettoyer les FIFOs défectueux
                        fi
                    done
                fi
            done
        " &
    } &

fi

# Boucle continue pour lire les événements
while true; do
    cat "$client_fifo" || break
done