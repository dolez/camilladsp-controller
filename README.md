# CamillaDSP Controller

Système de contrôle centralisé pour nodes CamillaDSP.

## Architecture

- **master/**: Raspberry Pi hotspot (contrôleur principal)
  - backend/: Serveur Express + Socket.IO
  - frontend/: Interface React
- **node-client/**: Client pour nodes CamillaDSP
- **dev/**: Environnement de développement

## Développement

```bash
# Démarrer l'environnement de développement
npm run dev

# Arrêter l'environnement
npm run dev:stop
```
