import { signal } from "@preact/signals";
import io from "socket.io-client";

// État global pour tous les nœuds
export const camillaState = signal({
  nodes: new Map(), // Map<string, NodeConfig>
  selectedNodes: new Set(), // Set<NodeConfig>
  nodeMetrics: new Map(), // Map<string, NodeMetrics>
});

class CamillaConnection {
  constructor(node) {
    this.node = node;
    this.socket = null;
    this.connected = false;
    this.metricsInterval = null;
  }

  connect() {
    try {
      // En développement, on ne se connecte pas réellement aux instances
      if (process.env.NODE_ENV === "development") {
        this.connected = true;
        console.log(
          `Mock connection to CamillaDSP at ${this.node.address}:${this.node.port}`
        );
        return;
      }

      const url = `http://${this.node.address}:${this.node.port}`;

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
        console.log(
          `Connected to CamillaDSP at ${this.node.address}:${this.node.port}`
        );
        this.startMetricsPolling();
      });

      this.socket.on("disconnect", () => {
        this.connected = false;
        this.stopMetricsPolling();
        console.log(
          `Disconnected from CamillaDSP at ${this.node.address}:${this.node.port}`
        );
      });

      // Écoute des mises à jour de métriques
      this.socket.on("metrics", (data) => {
        const currentState = camillaState.value;
        const updatedMetrics = new Map(currentState.nodeMetrics);
        updatedMetrics.set(this.node.address, data);

        camillaState.value = {
          ...currentState,
          nodeMetrics: updatedMetrics,
        };
      });

      // Écoute des mises à jour de configuration
      this.socket.on("config", (config) => {
        const currentState = camillaState.value;
        const updatedNodes = new Map(currentState.nodes);
        const node = updatedNodes.get(this.node.address);
        if (node) {
          node.config = config;
          updatedNodes.set(this.node.address, node);
          camillaState.value = {
            ...currentState,
            nodes: updatedNodes,
          };
        }
      });
    } catch (err) {
      console.error(
        `Failed to connect to ${this.node.address}:${this.node.port}:`,
        err
      );
    }
  }

  disconnect() {
    this.stopMetricsPolling();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
  }

  startMetricsPolling() {
    if (process.env.NODE_ENV === "development") return;

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
    this.connections = new Map(); // Map<nodeId, CamillaConnection>
    this.setupMainSocket();
  }

  setupMainSocket() {
    // Socket.io client pour le serveur principal
    const url =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : window.location.origin;

    this.mainSocket = io(url, {
      transports: ["websocket"],
      upgrade: false,
    });

    this.mainSocket.on("avahi-services", (services) => {
      console.log("Received services:", services);
      this.updateNodes(services);
    });

    this.mainSocket.on("connect", () => {
      console.log("Connected to main server");
    });

    this.mainSocket.on("connect_error", (error) => {
      console.error("Main server connection error:", error);
    });
  }

  // Helper pour générer un ID unique pour un nœud
  getNodeId(node) {
    return `${node.address}:${node.port}`;
  }

  initializeNode(node) {
    const nodeId = this.getNodeId(node);
    if (!this.connections.has(nodeId)) {
      const connection = new CamillaConnection(node);
      this.connections.set(nodeId, connection);
      connection.connect();
    }
  }

  removeNode(node) {
    const nodeId = this.getNodeId(node);
    const connection = this.connections.get(nodeId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(nodeId);
    }
  }

  disconnectAll() {
    this.connections.forEach((connection) => connection.disconnect());
    this.connections.clear();
  }

  updateNodes(services) {
    // Supprime les connexions pour les nœuds qui n'existent plus
    const currentNodeIds = new Set(services.map((s) => this.getNodeId(s)));
    this.connections.forEach((_, nodeId) => {
      if (!currentNodeIds.has(nodeId)) {
        const [address, port] = nodeId.split(":");
        this.removeNode({ address, port: parseInt(port, 10) });
      }
    });

    // Initialise les nouvelles connexions
    services.forEach((node) => this.initializeNode(node));

    // Met à jour l'état global
    camillaState.value = {
      ...camillaState.value,
      nodes: new Map(services.map((node) => [this.getNodeId(node), node])),
    };
  }

  // Méthodes utilitaires pour les commandes groupées
  setConfigValueForNodes(nodes, path, value) {
    nodes.forEach((node) => {
      const connection = this.connections.get(this.getNodeId(node));
      if (connection) {
        connection.setConfigValue(path, value);
      }
    });
  }
}

// Exporte l'instance singleton
export const camillaManager = new CamillaManager();
