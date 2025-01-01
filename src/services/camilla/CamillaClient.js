import { signal } from "@preact/signals";
import io from "socket.io-client";

// État global pour tous les nœuds
export const camillaState = signal({
  nodes: new Map(), // Map<string, NodeConfig>
  selectedNodes: new Set(), // Set<NodeConfig>
  nodeMetrics: new Map(), // Map<string, NodeMetrics>
});

class CamillaConnection {
  constructor(address) {
    this.address = address;
    this.socket = null;
    this.connected = false;
    this.metricsInterval = null;
  }

  connect() {
    try {
      // En développement, on se connecte directement au mock server
      const isDev = process.env.NODE_ENV === "development";
      const url = isDev ? "ws://localhost:5000" : `http://${this.address}:5000`;

      this.socket = io(url, {
        transports: ["websocket"],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
        forceNew: true,
        autoConnect: false,
        rememberUpgrade: true,
      });

      // Ajout d'événements de débogage
      this.socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      this.socket.connect();

      this.socket.on("connect", () => {
        this.connected = true;
        console.log(`Connected to CamillaDSP at ${this.address}`);
        this.startMetricsPolling();
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        this.stopMetricsPolling();
        console.log(`Disconnected from CamillaDSP at ${this.address}`);
      });

      // Écoute des mises à jour de métriques
      this.socket.on("metrics", (data) => {
        const currentState = camillaState.value;
        const updatedMetrics = new Map(currentState.nodeMetrics);
        updatedMetrics.set(this.address, data);

        camillaState.value = {
          ...currentState,
          nodeMetrics: updatedMetrics,
        };
      });

      // Écoute des mises à jour de configuration
      this.socket.on("config", (config) => {
        const currentState = camillaState.value;
        const updatedNodes = new Map(currentState.nodes);
        const node = updatedNodes.get(this.address);
        if (node) {
          node.config = config;
          updatedNodes.set(this.address, node);
          camillaState.value = {
            ...currentState,
            nodes: updatedNodes,
          };
        }
      });
    } catch (err) {
      console.error(`Failed to connect to ${this.address}:`, err);
    }
  }

  disconnect() {
    this.stopMetricsPolling();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startMetricsPolling() {
    this.metricsInterval = setInterval(() => {
      if (this.connected) {
        this.socket.emit("getmetrics");
      }
    }, 100);
  }

  stopMetricsPolling() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  // Méthodes de configuration
  setConfigValue(path, value) {
    if (!this.connected) return;
    this.socket.emit("setconfigvalue", { path, value });
  }

  // Méthodes de contrôle
  setFilterParam(filterName, paramName, value) {
    this.setConfigValue(`filters.${filterName}.parameters.${paramName}`, value);
  }

  setMixerGain(mixerName, destIndex, sourceIndex, gain) {
    this.setConfigValue(
      `mixers.${mixerName}.mapping.${destIndex}.sources.${sourceIndex}.gain`,
      gain
    );
  }

  setFilterBypass(pipelineIndex, bypassed) {
    this.setConfigValue(`pipeline.${pipelineIndex}.bypassed`, bypassed);
  }

  // Méthodes de gestion de la configuration
  getConfig(callback) {
    if (!this.connected) return;
    this.socket.emit("getconfig", callback);
  }

  saveConfig() {
    if (!this.connected) return;
    this.socket.emit("saveconfig");
  }
}

export class CamillaManager {
  constructor() {
    this.connections = new Map(); // Map<string, CamillaConnection>
  }

  initializeNode(node) {
    if (!this.connections.has(node.address)) {
      const connection = new CamillaConnection(node.address);
      this.connections.set(node.address, connection);
      connection.connect();
    }
  }

  removeNode(address) {
    const connection = this.connections.get(address);
    if (connection) {
      connection.disconnect();
      this.connections.delete(address);
    }
  }

  disconnectAll() {
    this.connections.forEach((connection) => connection.disconnect());
    this.connections.clear();
  }

  updateNodes(services) {
    // Supprime les connexions pour les nœuds qui n'existent plus
    const currentAddresses = new Set(services.map((s) => s.address));
    this.connections.forEach((_, address) => {
      if (!currentAddresses.has(address)) {
        this.removeNode(address);
      }
    });

    // Initialise les nouvelles connexions
    services.forEach((node) => this.initializeNode(node));

    // Met à jour l'état global
    camillaState.value = {
      ...camillaState.value,
      nodes: new Map(services.map((node) => [node.address, node])),
    };
  }

  // Méthodes utilitaires pour les commandes groupées
  setConfigValueForNodes(nodes, path, value) {
    nodes.forEach((node) => {
      const connection = this.connections.get(node.address);
      if (connection) {
        connection.setConfigValue(path, value);
      }
    });
  }
}

// Exporte l'instance singleton
export const camillaManager = new CamillaManager();
