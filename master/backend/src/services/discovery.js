// master/backend/src/services/discovery.js

const bonjour = require("bonjour")();
const EventEmitter = require("events");
const logger = require("../utils/logger");

class DiscoveryService extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map();
    this.browser = null;
    this.CAMILLADSP_SERVICE = "camilladsp";
  }

  /**
   * Initialise la découverte des nodes CamillaDSP sur le réseau
   */
  start() {
    logger.info("Starting CamillaDSP nodes discovery service...");

    this.browser = bonjour.find(
      { type: this.CAMILLADSP_SERVICE },
      this._handleServiceFound.bind(this)
    );

    // Gérer la perte de connexion avec un node
    this.browser.on("down", this._handleServiceDown.bind(this));
  }

  /**
   * Arrête le service de découverte
   */
  stop() {
    if (this.browser) {
      this.browser.stop();
      this.browser = null;
    }
    this.nodes.clear();
    logger.info("Discovery service stopped");
  }

  /**
   * Gère la découverte d'un nouveau service
   * @private
   */
  _handleServiceFound(service) {
    const nodeId = `${service.host}:${service.port}`;

    // Vérifier si c'est un nouveau node
    if (!this.nodes.has(nodeId)) {
      const nodeInfo = {
        id: nodeId,
        name: service.name,
        host: service.host,
        port: service.port,
        status: "online",
        lastSeen: Date.now(),
        metadata: service.txt || {},
        type: service.type,
      };

      this.nodes.set(nodeId, nodeInfo);
      logger.info(
        `New CamillaDSP node discovered: ${nodeInfo.name} at ${nodeId}`
      );
      this.emit("nodeDiscovered", nodeInfo);
    } else {
      // Mise à jour du node existant
      const existingNode = this.nodes.get(nodeId);
      existingNode.lastSeen = Date.now();
      existingNode.status = "online";
      this.emit("nodeUpdated", existingNode);
    }
  }

  /**
   * Gère la perte d'un service
   * @private
   */
  _handleServiceDown(service) {
    const nodeId = `${service.host}:${service.port}`;
    if (this.nodes.has(nodeId)) {
      const node = this.nodes.get(nodeId);
      node.status = "offline";
      node.lastSeen = Date.now();

      logger.warn(`Node ${node.name} (${nodeId}) went offline`);
      this.emit("nodeOffline", node);
    }
  }

  /**
   * Retourne la liste des nodes connus
   */
  getNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Vérifie si un node spécifique existe
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  /**
   * Retourne les informations d'un node spécifique
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
}

module.exports = new DiscoveryService();
