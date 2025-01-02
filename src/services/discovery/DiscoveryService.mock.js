class DiscoveryServiceMock {
  constructor(io) {
    this.io = io;
    this.services = new Map();
  }

  async start() {
    console.log("Démarrage du mock de découverte...");

    // Ajoute des services de test
    this.addMockService("CamillaDSP-Main", "node1.local", 1234, {
      version: "2.0.0",
      config: "main.yml",
    });

    // Broadcast initial uniquement
    this.broadcastUpdate();

    console.log("Mock de découverte démarré");
  }

  addMockService(name, ip, port, txt = {}) {
    this.services.set(name, {
      name,
      host: `${name}.local`,
      address: ip,
      port,
      txt,
    });
    this.broadcastUpdate();
  }

  broadcastUpdate() {
    const services = Array.from(this.services.values());
    console.log("Services mock disponibles:", services);
    this.io.emit("avahi-services", services);
  }

  stop() {
    // Plus besoin de nettoyer l'intervalle
  }
}

module.exports = DiscoveryServiceMock;
