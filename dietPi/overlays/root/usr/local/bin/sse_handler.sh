#!/bin/bash

# Création d'un FIFO unique pour ce client
client_fifo="/tmp/client_$$"
mkfifo "$client_fifo"

cleanup() {
    local pids
    pids=$(jobs -p)
    if [ -n "$pids" ]; then
        kill $pids 2>/dev/null
    fi
    rm -f "$client_fifo"
    [ -f "/tmp/distributor.pid" ] && [ "$$" = "$(cat /tmp/distributor.pid)" ] && rm -f "/tmp/distributor.pid"
}

trap cleanup EXIT INT TERM

# Envoyer les headers SSE
{
    printf "HTTP/1.1 200 OK\r\n"
    printf "Content-Type: text/event-stream\r\n"
    printf "Cache-Control: no-cache\r\n"
    printf "Connection: keep-alive\r\n"
    printf "Access-Control-Allow-Origin: *\r\n"
    printf "\r\n"
} >&3

# Démarrer le heartbeat en arrière-plan
(
    while true; do
        echo "data: {\"event\":\"heartbeat\"}\n\n" > "$client_fifo"
        sleep 30
    done
) &

# Fonction pour le distributeur d'événements
run_distributor() {
    local main_fifo="$1"
    local line
    
    # Utilisation de read avec un descripteur de fichier dédié pour une lecture bloquante
    exec 4<>"$main_fifo"
    
    while IFS= read -r line <&4; do
        if [ -n "$line" ]; then
            # Parcourir tous les FIFOs clients existants
            for client in /tmp/client_*; do
                if [ -p "$client" ]; then
                    # Vérifier si le client est toujours connecté
                    if ! echo "$line" > "$client" 2>/dev/null; then
                        # Si l'écriture échoue, le client est probablement déconnecté
                        rm -f "$client"
                    fi
                fi
            done
        fi
    done
    
    exec 4>&-
}

# Démarrage du distributeur si nécessaire
if [ ! -f "/tmp/distributor.pid" ] || ! kill -0 "$(cat /tmp/distributor.pid)" 2>/dev/null; then
    {
        echo $$ > "/tmp/distributor.pid"
        
        # Démarrer le distributeur dans un nouveau groupe de processus
        setsid bash -c "
            trap 'rm -f /tmp/distributor.pid' EXIT
            $(declare -f run_distributor)
            run_distributor '$1'
        " &
    } &
fi

# Lecture des événements pour ce client avec un descripteur dédié
exec 5<>"$client_fifo"

# Boucle de lecture bloquante
while IFS= read -r line <&5; do
    printf '%s\n' "$line" >&3
done

# Fermeture propre des descripteurs
exec 5>&-
exec 3>&-