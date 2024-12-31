import { signal } from "@preact/signals";

// Global state for all nodes
export const camillaState = signal({
  nodes: new Map(), // Map<string, NodeConfig>
  selectedNodes: new Set(), // Set<NodeConfig>
  nodeMetrics: new Map(), // Map<string, NodeMetrics>
});

class CamillaConnection {
  constructor(address, port) {
    this.address = address;
    this.port = port;
    this.ws = null;
    this.connected = false;
    this.metricsInterval = null;
  }

  connect() {
    try {
      this.ws = new WebSocket(`ws://${this.address}:${this.port}`);

      this.ws.onopen = () => {
        this.connected = true;
        console.log(`Connected to CamillaDSP at ${this.address}`);
        this.getCaptureRate();
        this.getStateFilePath();
        this.getSupportedDeviceTypes();
        this.getSignalPeaksSinceStart();
        this.startMetricsPolling();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.stopMetricsPolling();
        console.log(`Disconnected from CamillaDSP at ${this.address}`);
      };
    } catch (err) {
      console.error(`Failed to connect to ${this.address}:`, err);
    }
  }

  disconnect() {
    this.stopMetricsPolling();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  startMetricsPolling() {
    this.metricsInterval = setInterval(() => {
      if (this.connected) {
        this.getSignalLevels();
        this.getProcessingLoad();
        this.getBufferLevel();
        this.getSignalPeaksSinceStart();
      }
    }, 100);
  }

  stopMetricsPolling() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      const currentState = camillaState.value;
      const updatedMetrics = new Map(currentState.nodeMetrics);
      const nodeMetrics = updatedMetrics.get(this.address) || {};

      // Process different responses
      if (message.GetSignalLevels?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          ...message.GetSignalLevels.value,
        });
      }
      if (message.GetProcessingLoad?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          processingLoad: message.GetProcessingLoad.value,
        });
      }
      if (message.GetState?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          state: message.GetState.value,
        });
      }
      if (message.GetVolume?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          volume: message.GetVolume.value,
        });
      }
      // Add new metric handlers
      if (message.GetRateAdjust?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          rateAdjust: message.GetRateAdjust.value,
        });
      }
      if (message.GetBufferLevel?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          bufferLevel: message.GetBufferLevel.value,
        });
      }
      if (message.GetClippedSamples?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          clippedSamples: message.GetClippedSamples.value,
        });
      }
      if (message.GetCaptureRate?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          captureRate: message.GetCaptureRate.value,
        });
      }
      if (message.GetStateFilePath?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          stateFilePath: message.GetStateFilePath.value,
        });
      }
      if (message.GetSupportedDeviceTypes?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          supportedDeviceTypes: message.GetSupportedDeviceTypes.value,
        });
      }
      if (message.GetSignalPeaksSinceStart?.result === "Ok") {
        updatedMetrics.set(this.address, {
          ...nodeMetrics,
          peaks_since_start: {
            capture: message.GetSignalPeaksSinceStart.value.capture,
            playback: message.GetSignalPeaksSinceStart.value.playback,
          },
        });
      }

      camillaState.value = {
        ...currentState,
        nodeMetrics: updatedMetrics,
      };
    } catch (err) {
      console.error(`Error handling message from ${this.address}:`, err);
    }
  }

  sendCommand(command, arg = null) {
    if (!this.connected) {
      console.warn(`Not connected to ${this.address}`);
      return;
    }

    const message =
      arg !== null
        ? JSON.stringify({ [command]: arg })
        : JSON.stringify(command);

    this.ws.send(message);
  }

  // Volume Methods
  getVolume() {
    this.sendCommand("GetVolume");
  }
  setVolume(value) {
    this.sendCommand("SetVolume", value);
  }
  getFaderVolume(fader) {
    this.sendCommand("GetFaderVolume", fader);
  }
  setFaderVolume(fader, value) {
    this.sendCommand("SetFaderVolume", [fader, value]);
  }
  setFaderExternalVolume(fader, value) {
    this.sendCommand("SetFaderExternalVolume", [fader, value]);
  }
  adjustFaderVolume(fader, value) {
    this.sendCommand("AdjustFaderVolume", [fader, value]);
  }

  // Mute Methods
  getMute() {
    this.sendCommand("GetMute");
  }
  setMute(value) {
    this.sendCommand("SetMute", value);
  }
  getFaderMute(fader) {
    this.sendCommand("GetFaderMute", fader);
  }
  setFaderMute(fader, value) {
    this.sendCommand("SetFaderMute", [fader, value]);
  }
  toggleFaderMute(fader) {
    this.sendCommand("ToggleFaderMute", fader);
  }

  // Status Methods
  getRateAdjust() {
    this.sendCommand("GetRateAdjust");
  }
  getBufferLevel() {
    this.sendCommand("GetBufferLevel");
  }
  getClippedSamples() {
    this.sendCommand("GetClippedSamples");
  }
  getProcessingLoad() {
    this.sendCommand("GetProcessingLoad");
  }

  // Level Monitoring Methods
  getSignalRange() {
    this.sendCommand("GetSignalRange");
  }
  getCaptureSignalRms() {
    this.sendCommand("GetCaptureSignalRms");
  }
  getPlaybackSignalRms() {
    this.sendCommand("GetPlaybackSignalRms");
  }
  getCaptureSignalPeak() {
    this.sendCommand("GetCaptureSignalPeak");
  }
  getPlaybackSignalPeak() {
    this.sendCommand("GetPlaybackSignalPeak");
  }
  getPlaybackSignalPeakSince(interval) {
    this.sendCommand("GetPlaybackSignalPeakSince", interval);
  }
  getPlaybackSignalRmsSince(interval) {
    this.sendCommand("GetPlaybackSignalRmsSince", interval);
  }
  getCaptureSignalPeakSince(interval) {
    this.sendCommand("GetCaptureSignalPeakSince", interval);
  }
  getCaptureSignalRmsSince(interval) {
    this.sendCommand("GetCaptureSignalRmsSince", interval);
  }
  getSignalLevels() {
    this.sendCommand("GetSignalLevels");
  }
  getSignalLevelsSince(interval) {
    this.sendCommand("GetSignalLevelsSince", interval);
  }
  getSignalLevelsSinceLast() {
    this.sendCommand("GetSignalLevelsSinceLast");
  }
  getSignalPeaksSinceStart() {
    this.sendCommand("GetSignalPeaksSinceStart");
  }
  resetSignalPeaksSinceStart() {
    this.sendCommand("ResetSignalPeaksSinceStart");
  }

  // Config Methods
  getConfig() {
    this.sendCommand("GetConfig");
  }
  setConfig(config) {
    this.sendCommand("SetConfig", config);
  }
  getConfigFilePath() {
    this.sendCommand("GetConfigFilePath");
  }
  setConfigFilePath(path) {
    this.sendCommand("SetConfigFilePath", path);
  }
  getPreviousConfig() {
    this.sendCommand("GetPreviousConfig");
  }
  validateConfig(config) {
    this.sendCommand("ValidateConfig", config);
  }
  getConfigTitle() {
    this.sendCommand("GetConfigTitle");
  }
  getConfigDescription() {
    this.sendCommand("GetConfigDescription");
  }

  // Rate Monitor Methods
  getCaptureRate() {
    this.sendCommand("GetCaptureRate");
  }

  // Settings Methods
  getUpdateInterval() {
    this.sendCommand("GetUpdateInterval");
  }
  setUpdateInterval(value) {
    this.sendCommand("SetUpdateInterval", value);
  }

  // General Methods
  getState() {
    this.sendCommand("GetState");
  }
  getStopReason() {
    this.sendCommand("GetStopReason");
  }
  stop() {
    this.sendCommand("Stop");
  }
  exit() {
    this.sendCommand("Exit");
  }
  reload() {
    this.sendCommand("Reload");
  }
  getSupportedDeviceTypes() {
    this.sendCommand("GetSupportedDeviceTypes");
  }
  getStateFilePath() {
    this.sendCommand("GetStateFilePath");
  }
  getStateFileUpdated() {
    this.sendCommand("GetStateFileUpdated");
  }
  getAvailablePlaybackDevices(backend) {
    this.sendCommand("GetAvailablePlaybackDevices", backend);
  }
  getAvailableCaptureDevices(backend) {
    this.sendCommand("GetAvailableCaptureDevices", backend);
  }
  getVersion() {
    this.sendCommand("GetVersion");
  }
}

export class CamillaManager {
  constructor() {
    this.connections = new Map(); // Map<string, CamillaConnection>
  }

  initializeNode(node) {
    if (!this.connections.has(node.address)) {
      const connection = new CamillaConnection(node.address, 1234);
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

  sendCommand(command, value, nodes) {
    nodes.forEach((node) => {
      const connection = this.connections.get(node.address);
      if (connection) {
        connection.sendCommand(command, value);
      }
    });
  }

  updateNodes(services) {
    // Remove connections for nodes that no longer exist
    const currentAddresses = new Set(services.map((s) => s.address));
    this.connections.forEach((_, address) => {
      if (!currentAddresses.has(address)) {
        this.removeNode(address);
      }
    });
    // Initialize new connections
    services.forEach((node) => this.initializeNode(node));

    // Update global state
    camillaState.value = {
      ...camillaState.value,
      nodes: new Map(services.map((node) => [node.address, node])),
    };
  }
}

// Export singleton instance
export const camillaManager = new CamillaManager();
