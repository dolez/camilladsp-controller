export class CamillaClient {
  constructor(address, port) {
    this.address = address;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.configInterval = null;
    this.metricsInterval = null;
    this.onMetrics = null;
    this.onConfig = null;
    this.currentConfig = null;
    this.lastMetrics = {
      captureRms: null,
      playbackRms: null,
      cpuLoad: 0,
      captureRate: 0,
      captureLevel: -100,
    };
  }

  connect() {
    try {
      const url = `ws://${this.address}:${this.port}`;
      console.log(`Tentative de connexion à CamillaDSP sur ${url}`);

      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.connected = true;
        console.log(`Connected to CamillaDSP at ${this.address}:${this.port}`);
        this.startConfigPolling();
        //this.startMetricsPolling();
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.stopConfigPolling();
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
          if (data["GetConfigJson"]) {
            // La valeur est une chaîne JSON qui doit être parsée
            const configString = data["GetConfigJson"].value;
            this.currentConfig = JSON.parse(configString);
            this.onConfig?.(this.currentConfig);
          } else {
            // Gestion des métriques
            const metrics = { ...this.lastMetrics };

            // Métriques rapides (VU-mètres)
            if (data["GetCaptureSignalRms"]) {
              metrics.captureRms = data["GetCaptureSignalRms"].value;
            }
            if (data["GetPlaybackSignalRms"]) {
              metrics.playbackRms = data["GetPlaybackSignalRms"].value;
            }

            // Métriques lentes
            if (data["GetProcessingLoad"]) {
              metrics.cpuLoad = data["GetProcessingLoad"].value; // Convertir en pourcentage
            }
            if (data["GetCaptureRate"]) {
              metrics.captureRate = data["GetCaptureRate"].value / 1000; // Convertir en kHz
            }

            this.lastMetrics = metrics;
            this.onMetrics?.(metrics);
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
    this.stopConfigPolling();
    this.stopMetricsPolling();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.currentConfig = null;
  }

  startConfigPolling() {
    this.configInterval = setInterval(() => {
      if (this.connected) {
        this.socket.send('"GetConfigJson"');
        this.socket.send('"GetProcessingLoad"');
        this.socket.send('"GetCaptureRate"');
      }
    }, 1000); // 1Hz polling
  }

  stopConfigPolling() {
    if (this.configInterval) {
      clearInterval(this.configInterval);
      this.configInterval = null;
    }
  }

  startMetricsPolling() {
    this.metricsInterval = setInterval(() => {
      if (this.connected) {
        this.socket.send('"GetCaptureSignalRms"');
        this.socket.send('"GetPlaybackSignalRms"');
      }
    }, 100); // 10Hz polling
  }

  stopMetricsPolling() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  setConfig(config) {
    if (this.connected) {
      this.currentConfig = config;

      const command = {
        SetConfigJson: JSON.stringify(config),
      };
      this.socket.send(JSON.stringify(command));
    }
  }

  // Méthodes utilitaires pour modifier la config
  setFilterParam(filterName, paramName, value) {
    if (!this.currentConfig) return;

    const newConfig = { ...this.currentConfig };
    if (newConfig.filters?.[filterName]?.parameters) {
      // Créer une copie des paramètres existants
      const currentParams = { ...newConfig.filters[filterName].parameters };

      // Mettre à jour le paramètre avec la nouvelle valeur
      newConfig.filters[filterName].parameters = {
        ...currentParams,
        [paramName]: value,
      };

      this.setConfig(newConfig);
    }
  }

  setMixerGain(mixerName, destIndex, sourceIndex, gain) {
    if (!this.currentConfig) return;

    const newConfig = { ...this.currentConfig };
    if (newConfig.mixers?.[mixerName]?.mapping) {
      newConfig.mixers[mixerName].mapping[destIndex].sources[sourceIndex].gain =
        gain;
      this.setConfig(newConfig);
    }
  }

  setFilterBypass(pipelineIndex, bypassed) {
    if (!this.currentConfig) return;

    const newConfig = { ...this.currentConfig };
    if (newConfig.pipeline?.[pipelineIndex]) {
      newConfig.pipeline[pipelineIndex].bypassed = bypassed;
      this.setConfig(newConfig);
    }
  }
}
