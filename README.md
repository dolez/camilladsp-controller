# CamillaDSP Controller

Système de contrôle centralisé pour nodes CamillaDSP, basé sur un Raspberry Pi maître agissant comme point d'accès WiFi et servant d'interface de contrôle pour plusieurs nodes CamillaDSP.

## Architecture Globale

### Composants Principaux
- **Master (Raspberry Pi Hotspot)**
  - Point d'accès WiFi dédié
  - Interface web de contrôle
  - Découverte automatique des nodes
  - API centralisée

- **Nodes CamillaDSP**
  - Auto-connexion au réseau
  - Publication de service via Bonjour
  - Interface Socket.IO avec le master
  - Intégration avec CamillaDSP

### Stack Technique
- **Backend**
  - Node.js/Express
  - Socket.IO pour communication temps réel
  - Bonjour/Zeroconf pour découverte de services

- **Frontend**
  - React
  - Tailwind CSS
  - Socket.IO client

- **Réseau**
  - hostapd (Point d'accès WiFi)
  - dnsmasq (DHCP + DNS)
  - WPA2 pour sécurité

## Structure du Projet

```
camilladsp-controller/
├── master/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.js           # Point d'entrée
│   │   │   ├── services/        # Services métier
│   │   │   │   ├── discovery.js # Découverte des nodes
│   │   │   │   └── socket.js    # Gestion Socket.IO
│   │   │   └── utils/
│   │   │       └── logger.js    # Logging
│   │   └── Dockerfile          
│   └── frontend/
│       ├── src/
│       │   └── components/      # Composants React
│       └── Dockerfile
├── node-client/                # Code pour nodes CamillaDSP
│   ├── src/
│   │   ├── index.js           # Point d'entrée node
│   │   ├── advertise.js       # Publication Bonjour
│   │   └── socket.js          # Client Socket.IO
│   └── Dockerfile
├── scripts/
│   ├── network/
│   │   ├── setup-master-network.sh  # Config réseau master
│   │   ├── setup-node-network.sh    # Config réseau nodes
│   │   └── test-network.sh          # Tests réseau
│   └── deployment/
│   │   ├── deploy-master.sh         # Déploiement master
│   │   └── deploy-node.sh           # Déploiement nodes
│   └── image/                    # Nouveau
│       ├── build-image.sh        # Génération d'images
│       └── flash-image.sh        # Flashage d'images
├── dev/
│   ├── docker-compose.yml          # Env de développement
│   └── mock-node/                  # Simulation de nodes
└── docs/
    ├── network-setup.md            # Doc réseau
    └── deployment.md               # Doc déploiement
```

## Configuration Réseau

### Master (Point d'Accès)
- SSID: CamillaDSP-Network
- Sécurité: WPA2-PSK
- IP: 192.168.4.1
- DHCP: 192.168.4.2 - 192.168.4.20

### Nodes
- Connexion automatique au réseau
- Configuration DHCP
- Discovery via Bonjour

## Développement

### Prérequis
- Node.js 18+
- Docker et Docker Compose
- Git

### Installation
```bash
# Cloner le dépôt
git clone [repository-url]
cd camilladsp-controller

# Installation des dépendances
npm install

# Démarrer l'environnement de développement
npm run dev
```

### Scripts Disponibles
```bash
# Développement
npm run dev          # Démarre l'environnement de dev
npm run dev:stop     # Arrête l'environnement de dev

# Déploiement
npm run build:master # Build l'image master
npm run build:node   # Build l'image node

# Configuration réseau
npm run setup:master-network  # Configure le réseau master
npm run setup:node-network    # Configure le réseau node

# Tests
npm test             # Lance les tests
```

## Déploiement

### Master (Raspberry Pi Hotspot)
```bash
# Configuration du réseau
sudo ./scripts/network/setup-master-network.sh

# Déploiement de l'application
sudo ./scripts/deployment/deploy-master.sh
```

### Nodes CamillaDSP
```bash
# Configuration du réseau
sudo ./scripts/network/setup-node-network.sh

# Déploiement du client
sudo ./scripts/deployment/deploy-node.sh
```

## Fonctionnalités Implémentées

### Discovery Service
- Découverte automatique des nodes via Bonjour
- Suivi de l'état des nodes en temps réel
- Notification des changements d'état

### Communication
- Socket.IO pour communication temps réel
- Protocole événementiel standardisé
- Gestion des déconnexions

### Réseau
- Configuration automatique du point d'accès
- Attribution DHCP automatique
- Tests de connectivité

## Gestion des Images

Le projet utilise pi-gen pour générer des images Raspberry Pi personnalisées pour le master et les nodes.

### Types d'Images
- **Master Image**
  - Point d'accès WiFi préconfiguré
  - Interface web de contrôle installée
  - Services système configurés
  - Configuration réseau automatique

- **Node Image**
  - Client CamillaDSP préinstallé
  - Configuration réseau automatique
  - Discovery service configuré
  - Scripts de maintenance

### Construction des Images
```bash
# Construction des deux types d'images
npm run image:build

# Les images sont générées dans ./dist/
# Format: camilladsp-[type]-[date]-[git-hash].zip
```

### Flashage des Images
```bash
# Flasher une image master
npm run image:flash-master /dev/sdX

# Flasher une image node
npm run image:flash-node /dev/sdX
```

### Contenu des Images

#### Configuration Système
- OS: Raspberry Pi OS Bullseye
- Locale: fr_FR.UTF-8
- Timezone: Europe/Paris
- Clavier: FR
- SSH activé par défaut

#### Logiciels Préinstallés
- Node.js 18
- Outils réseau (hostapd, dnsmasq)
- Utilitaires système
- Application CamillaDSP Controller

#### Services Système
- **Master**
  - `camilladsp-master.service`
  - `hostapd.service`
  - `dnsmasq.service`

- **Node**
  - `camilladsp-node.service`
  - `camilladsp.service`

#### Scripts Utilitaires
```bash
# Sur le master
/opt/camilladsp-controller/scripts/
├── backup.sh          # Sauvegarde de la configuration
├── restore.sh         # Restauration
├── update.sh          # Mise à jour du système
└── monitor.sh         # Monitoring réseau

# Sur les nodes
/opt/camilladsp-controller/scripts/
├── health-check.sh    # Vérification état
└── reconnect.sh       # Reconnexion réseau
```

### Premier Démarrage

1. **Master**
   ```bash
   # L'image démarre automatiquement en point d'accès
   # Accès web: http://192.168.4.1
   # SSH: ssh pi@192.168.4.1
   ```

2. **Node**
   ```bash
   # Connexion automatique au master
   # Vérification: ssh pi@[ip-node]
   systemctl status camilladsp-node
   ```

### Maintenance

#### Backup/Restore
```bash
# Sur le master
/opt/camilladsp-controller/scripts/backup.sh
/opt/camilladsp-controller/scripts/restore.sh [backup-file]

# Les backups incluent :
# - Configuration réseau
# - Paramètres CamillaDSP
# - Configuration des nodes
```

#### Mise à jour
```bash
# Mise à jour du système et de l'application
/opt/camilladsp-controller/scripts/update.sh
```

#### Monitoring
```bash
# État du réseau
/opt/camilladsp-controller/scripts/monitor.sh network

# État des nodes
/opt/camilladsp-controller/scripts/monitor.sh nodes

# Journaux système
/opt/camilladsp-controller/scripts/monitor.sh logs

# Santé système
/opt/camilladsp-controller/scripts/monitor.sh health
```

## Prochaines Étapes
1. Interface utilisateur React
2. Intégration avec l'API CamillaDSP
3. Système de monitoring réseau
4. Gestion des mises à jour
5. Interface d'administration réseau

## Contribution
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Notes de Développement
- Le développement se fait principalement via l'environnement Docker
- Les tests peuvent être effectués sans matériel grâce aux mocks
- L'architecture est conçue pour être facilement maintenable
- La documentation est maintenue à jour avec le code

## Troubleshooting

### Réseau
```bash
# Vérification du point d'accès
systemctl status hostapd
systemctl status dnsmasq

# Liste des clients connectés
iw dev wlan0 station dump

# Test de la configuration
./scripts/network/test-network.sh
```

### Application
```bash
# Logs du master
journalctl -u camilladsp-master

# État des nodes
curl http://localhost:4000/api/nodes
```

## État Actuel du Projet
- ✅ Structure de base
- ✅ Configuration réseau
- ✅ Service de découverte
- ✅ Scripts de déploiement
- ✅ Génération d'images          # Nouveau
- ✅ Scripts de maintenance       # Nouveau
- ⏳ Interface utilisateur
- ⏳ Intégration CamillaDSP
- ⏳ Tests complets
- ⏳ Documentation utilisateur finale

## Contact
[Vos informations de contact]

## Licence
[Votre licence]
## Configuration Réseau

Le système nécessite une configuration réseau spécifique :

### Raspberry Pi Maître
- Agit comme point d'accès WiFi
- Configure automatiquement les clients via DHCP
- Fournit une connexion isolée pour les nodes

### Nodes CamillaDSP
- Se connectent automatiquement au réseau maître
- Obtiennent une configuration réseau via DHCP

Voir [Documentation Réseau](docs/network-setup.md) pour plus de détails.

