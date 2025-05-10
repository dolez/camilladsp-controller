## Create image
needs Docker
```bash
cd dietPi 
./build.sh
```
## List serial ports for connection to shell
needs usb in gadget serial ( not power usb )
```
ls /dev/tty.* 
screen /dev/tty.usbmodem2146101 115200
```

## Utilisation de screen (console série)

### Lister les sessions screen actives
```bash
screen -ls
```

### Rejoindre une session détachée
```bash
screen -r [ID]
```

### Détacher une session (laisser tourner en arrière-plan)
Dans la session screen, appuyer sur :
```
Ctrl + a puis d
```

### Quitter et fermer la session screen
Dans la session screen, taper :
```bash
exit
```

### Forcer la reconnexion à une session déjà attachée
```bash
screen -dr [ID]
```

### Supprimer une session detachée
```bash
screen -S [ID] -X quit
```
