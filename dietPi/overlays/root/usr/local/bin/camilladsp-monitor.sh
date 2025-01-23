#!/bin/bash

NODES_FILE="/tmp/camilladsp_nodes.json"
FIFO="/tmp/netcat_pipe"

# Amélioration du cleanup avec vérification des processus en arrière-plan
cleanup() {
    echo "Cleaning up..."
    rm -f "$NODES_FILE" "$FIFO" 
    jobs -p | xargs -r kill
    exit 0
}

trap cleanup EXIT INT TERM

[ -p "$FIFO" ] && rm "$FIFO"
mkfifo "$FIFO"

socat TCP-LISTEN:8080,reuseaddr,fork,bind=127.0.0.1 SYSTEM:"/usr/local/bin/sse_handler.sh $FIFO 3>&1" &

SOCAT_PID=$!
echo "Socat started with PID $SOCAT_PID"

# Fonction améliorée pour mettre à jour le fichier nodes
update_nodes_file() {
    local temp_output
    temp_output=$(timeout 5 avahi-browse --parsable --resolve --terminate --no-db-lookup _camilladsp._tcp)
    local exit_code=$?
    
    if [ $exit_code -ne 0 ] || [ -z "$temp_output" ]; then
        echo '{"nodes":[]}' > "$NODES_FILE"
        return
    fi

    echo "$temp_output" | \
    awk -F';' '/^=/ {
        # Convertir les \032 en espaces
        gsub(/\\032/, " ", $4);  # Nom
        gsub(/\\032/, " ", $7);  # Hostname
        
        # Échapper les guillemets
        gsub(/"/, "\\\"", $4);
        gsub(/"/, "\\\"", $7);
        
        # Préparer les champs
        name = ($4 == "" ? "null" : "\""$4"\"");
        host = ($7 == "" ? "null" : "\""$7"\"");
        ip = ($8 == "" ? "null" : "\""$8"\"");
        port = ($9 == "" || $9 !~ /^[0-9]+$/ ? "null" : $9);
        interface = ($2 == "" ? "null" : "\""$2"\"");
        protocol = ($3 == "" ? "null" : "\""$3"\"");
        
        printf "{\"name\":%s,\"host\":%s,\"ip\":%s,\"port\":%s,\"interface\":%s,\"protocol\":%s}\n",
            name, host, ip, port, interface, protocol
    }' | \
    jq -c '{"nodes":[inputs]}' > "$NODES_FILE"
}

# Initialiser le fichier nodes
echo '{"nodes":[]}' > "$NODES_FILE"
update_nodes_file

# Monitorer les changements avec gestion d'erreurs améliorée
avahi-browse --parsable --resolve --no-db-lookup _camilladsp._tcp | while read -r line; do
    case ${line:0:1} in
        '+') # Service découvert
            # Pas d'action nécessaire pour l'instant, on attend la résolution complète
            ;;
        '=') # Service résolu avec détails
            update_nodes_file
            json_event=$(echo "$line" | awk -F';' '{
                gsub(/"/, "\\\"", $4); # name est dans $4 (TestCamillaDSP)
                printf "{\"event\":\"connected\",\"interface\":\"%s\",\"protocol\":\"%s\",\"name\":\"%s\",\"host\":\"%s\",\"ip\":\"%s\",\"port\":%s}",
                $2, $3, $4, $7, $8, $9
            }')
            ;;
        '-') # Service déconnecté
            update_nodes_file
            json_event=$(echo "$line" | awk -F';' '{
                gsub(/"/, "\\\"", $4);
                printf "{\"event\":\"disconnected\",\"interface\":\"%s\",\"protocol\":\"%s\",\"name\":\"%s\"}",
                $2, $3, $4
            }')
            ;;
    esac
    
    if [ -n "$json_event" ]; then
        echo -e "data: $json_event\n\n" > "$FIFO"
    fi
done