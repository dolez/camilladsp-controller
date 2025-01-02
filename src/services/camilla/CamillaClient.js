export class CamillaClient {
  constructor(address, port) {
    this.address = address;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.metricsInterval = null;
    this.onMetrics = null;
    this.onConfig = null;
  }

  connect() {
    try {
      const url = `ws://${this.address}:${this.port}`;
      console.log(`Tentative de connexion à CamillaDSP sur ${url}`);

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.connected = true;
        console.log(`Connected to CamillaDSP at ${this.address}:${this.port}`);
        //this.startMetricsPolling();
        this.getConfig();
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.stopMetricsPolling();
        console.log(
          `Disconnected from CamillaDSP at ${this.address}:${this.port}`
        );
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMetrics && data.type === "metrics") {
            this.onMetrics(data.value);
          } else if (this.onConfig && data["GetConfigJson"]) {
            debugger;
            this.onConfig(JSON.parse(data["GetConfigJson"].value));
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
    } catch (err) {
      console.error(`Failed to connect to ${this.address}:${this.port}:`, err);
    }
  }

  disconnect() {
    this.stopMetricsPolling();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
  }

  startMetricsPolling() {
    this.metricsInterval = setInterval(() => {
      if (this.connected) {
        this.socket.send('"GetMetrics"');
      }
    }, 100);
  }

  stopMetricsPolling() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  getConfig() {
    if (this.connected) {
      this.socket.send('"GetConfigJson"');
    }
  }

  setConfigValue(path, value) {
    if (this.connected) {
      this.socket.send(
        JSON.stringify({
          type: "SetConfigValue",
          path,
          value,
        })
      );
    }
  }

  // Méthodes utilitaires
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
}
