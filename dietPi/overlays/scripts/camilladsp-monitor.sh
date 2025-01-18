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

socat TCP-LISTEN:8080,reuseaddr,fork,bind=127.0.0.1 SYSTEM:"/usr/local/bin/sse_handler.sh $FIFO" &


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
        gsub(/"/, "\\\"", $3); # Échapper les guillemets dans les noms
        gsub(/"/, "\\\"", $6);
        name = ($3 == "" ? "null" : "\"" $3 "\"");
        host = ($6 == "" ? "null" : "\"" $6 "\"");
        ip = ($7 == "" ? "null" : "\"" $7 "\""); # Correction: $7 pour IP
        port = ($8 == "" || $8 !~ /^[0-9]+$/ ? "null" : $8); # Correction: $8 pour port
        print "{\"name\":" name ",\"host\":" host ",\"ip\":" ip ",\"port\":" port "}"
    }' | \
    jq -c '{"nodes":.}' > "$NODES_FILE"
}

# Initialiser le fichier nodes
echo '{"nodes":[]}' > "$NODES_FILE"
update_nodes_file

# Monitorer les changements avec gestion d'erreurs améliorée
avahi-browse --parsable --resolve --no-db-lookup _camilladsp._tcp | while read -r line; do
    case ${line:0:1} in
        '=') # Service résolu avec détails
            update_nodes_file
            json_event=$(echo "$line" | awk -F';' '{
                gsub(/"/, "\\\"", $3);
                gsub(/"/, "\\\"", $6);
                printf "{\"event\":\"connected\",\"name\":\"%s\",\"host\":\"%s\",\"ip\":\"%s\",\"port\":%s}",
                $3, $6, $7, $8
            }')
            ;;
        '-') # Service déconnecté
            update_nodes_file
            json_event=$(echo "$line" | awk -F';' '{
                gsub(/"/, "\\\"", $3);
                printf "{\"event\":\"disconnected\",\"name\":\"%s\"}",
                $3
            }')
            ;;
    esac
    
    if [ -n "$json_event" ]; then
        echo -e "data: $json_event\n\n" > "$FIFO"
    fi
done