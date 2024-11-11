// master/backend/src/services/socket.js

const discovery = require("./discovery");
const logger = require("../utils/logger");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this._setupDiscoveryEvents();
  }

  /**
   * Configure les événements de découverte pour tous les clients
   * @private
   */
  _setupDiscoveryEvents() {
    // Transmet les événements de découverte à tous les clients connectés
    discovery.on("nodeDiscovered", (node) => {
      this.io.emit("node:discovered", node);
    });

    discovery.on("nodeOffline", (node) => {
      this.io.emit("node:offline", node);
    });

    discovery.on("nodeUpdated", (node) => {
      this.io.emit("node:updated", node);
    });
  }

  /**
   * Gère une nouvelle connexion client
   * @param {Socket} socket Instance Socket.IO
   */
  handleConnection(socket) {
    logger.info(`New client connected: ${socket.id}`);

    // Envoie la liste initiale des nodes
    socket.emit("nodes:list", discovery.getNodes());

    // Gestion des événements spécifiques au client
    socket.on("node:getStatus", (nodeId) => {
      const node = discovery.getNode(nodeId);
      if (node) {
        socket.emit("node:status", node);
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  }
}

module.exports = SocketHandler;
