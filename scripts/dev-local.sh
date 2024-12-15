#!/bin/bash
export PORT=3000
export NODE_ENV=development

# Lance Vite
npm run dev &
VITE_PID=$!

# Lance le serveur
npm run server &
SERVER_PID=$!

cleanup() {
    kill $VITE_PID
    kill $SERVER_PID
    exit 0
}

trap cleanup INT TERM
echo "🚀 Développement local lancé"
echo "Frontend : http://localhost:5173"
echo "Backend : http://localhost:3000"
echo "Ctrl+C pour arrêter"
wait