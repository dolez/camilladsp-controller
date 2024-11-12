# Configuration Réseau CamillaDSP Controller

## Vue d'ensemble
Le système utilise une architecture réseau en étoile avec :
- Un Raspberry Pi maître agissant comme point d'accès WiFi
- Des nodes CamillaDSP se connectant au point d'accès

## Configuration du Maître

```bash
# En tant que root sur le Raspberry Pi maître
./scripts/network/setup-master-network.sh
```

### Détails de la Configuration
- SSID: CamillaDSP-Network
- IP du point d'accès: 192.168.4.1
- Plage DHCP: 192.168.4.2 - 192.168.4.20
- Sécurité: WPA2-PSK

## Configuration des Nodes

```bash
# En tant que root sur chaque node
./scripts/network/setup-node-network.sh
```

### Détails de la Configuration
- Connexion automatique au réseau
- Configuration DHCP
- Hostname unique par node

## Scripts de Déploiement

Les scripts de déploiement configurent automatiquement :
1. L'environnement système
2. Le réseau
3. L'application

```bash
# Déploiement du maître
./scripts/deployment/deploy-master.sh

# Déploiement d'un node
./scripts/deployment/deploy-node.sh
```

## Dépannage

### Vérification du Point d'Accès
```bash
# Statut du service hostapd
systemctl status hostapd

# Statut du service dnsmasq
systemctl status dnsmasq

# Voir les clients connectés
iw dev wlan0 station dump
```

### Vérification des Nodes
```bash
# Statut de la connexion WiFi
iwconfig wlan0

# Adresse IP attribuée
ip addr show wlan0
```
