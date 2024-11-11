// dev/mock-node/src/index.js

const bonjour = require("bonjour")();
const { io } = require("socket.io-client");
const logger = require("./logger");

class MockCamillaDSP {
  constructor() {
    this.nodeName =
      process.env.NODE_NAME ||
      `mock-node-${Math.random().toString(36).substr(2, 9)}`;
    this.nodePort = parseInt(process.env.NODE_PORT, 10) || 5000;
    this.masterUrl = process.env.MASTER_URL || "http://localhost:4000";
  }

  start() {
    // Publication du service
    this.service = bonjour.publish({
      name: this.nodeName,
      type: "camilladsp",
      port: this.nodePort,
      txt: {
        version: "1.0.0",
        type: "mock",
      },
    });

    logger.info(
      `Publishing CamillaDSP service: ${this.nodeName} on port ${this.nodePort}`
    );

    // Connexion au master
    this.socket = io(this.masterUrl);

    this.socket.on("connect", () => {
      logger.info("Connected to master");
    });

    this.socket.on("disconnect", () => {
      logger.warn("Disconnected from master");
    });

    // Simuler des changements d'état périodiques
    setInterval(() => {
      this.socket.emit("status:update", {
        name: this.nodeName,
        status: "running",
        timestamp: Date.now(),
      });
    }, 5000);
  }

  stop() {
    if (this.service) {
      this.service.stop();
    }
    if (this.socket) {
      this.socket.disconnect();
    }
    logger.info("Mock CamillaDSP node stopped");
  }
}

const mockNode = new MockCamillaDSP();
mockNode.start();

// Gestion de l'arrêt gracieux
process.on("SIGTERM", () => {
  mockNode.stop();
  process.exit(0);
});
