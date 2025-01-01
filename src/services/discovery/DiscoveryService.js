const { Bonjour } = require("bonjour-service");

class ServiceMonitor {
  constructor(io) {
    this.io = io;
    this.services = new Map();
    this.bonjour = new Bonjour();
  }

  getIpAddress(addresses) {
    // Filtre pour trouver la première adresse IPv4
    return addresses.find((addr) => {
      // Vérifie si c'est une adresse IPv4 valide
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipv4Regex.test(addr);
    });
  }

  start() {
    return new Promise((resolve) => {
      console.log("Démarrage du monitoring des services...");

      const browser = this.bonjour.find({
        type: "camilladsp",
      });

      browser.on("up", (service) => {
        console.log("Service détecté:", service.name);
        console.log("Adresses disponibles:", service.addresses);

        const ipAddress = this.getIpAddress(service.addresses);

        if (ipAddress) {
          this.services.set(service.name, {
            name: service.name,
            host: service.host,
            address: ipAddress,
            port: service.port,
            txt: service.txt || {},
          });
          console.log("Service ajouté avec IP:", ipAddress);
          this.broadcastUpdate();
        } else {
          console.log("Aucune adresse IP valide trouvée pour:", service.name);
        }
      });

      browser.on("down", (service) => {
        console.log("Service perdu:", service.name);
        this.services.delete(service.name);
        this.broadcastUpdate();
      });

      console.log("Monitoring démarré");
      resolve();
    });
  }

  stop() {
    if (this.bonjour) {
      this.bonjour.destroy();
    }
  }

  broadcastUpdate() {
    const services = Array.from(this.services.values());
    console.log("Services disponibles:", services);
    this.io.emit("avahi-services", services);
  }
}

module.exports = ServiceMonitor;
