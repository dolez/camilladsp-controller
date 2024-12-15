// src/services/avahi-monitor.mock.js
class AvahiMonitorMock {
  constructor(io) {
    this.io = io;
    this.services = new Map();
    this.mockInterval = null;
  }

  start() {
    // Simulons quelques services initiaux
    this.addMockService("CamillaDSP-Main", "192.168.1.100", 5000);
    this.addMockService("CamillaDSP-Bedroom", "192.168.1.101", 5001);

    // Simuler des changements dynamiques
    this.mockInterval = setInterval(() => {
      // Simuler l'apparition/disparition aléatoire de services
      if (Math.random() > 0.7) {
        this.addMockService(
          `CamillaDSP-${Math.random().toString(36).substring(7)}`,
          `192.168.1.${Math.floor(Math.random() * 255)}`,
          5000 + Math.floor(Math.random() * 100)
        );
      }
    }, 10000);

    this.broadcastUpdate();
  }

  addMockService(name, ip, port) {
    this.services.set(name, {
      name: name,
      host: `${name.toLowerCase()}.local`,
      address: ip,
      port: port,
      txt: {
        version: "1.0.0",
        config: "default.yml",
        status: "running",
      },
    });
    this.broadcastUpdate();
  }

  broadcastUpdate() {
    this.io.emit("avahi-services", Array.from(this.services.values()));
  }

  stop() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }
}

module.exports = AvahiMonitorMock;
