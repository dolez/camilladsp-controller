class CamillaServerMock {
  constructor(io) {
    this.io = io;
    this.nodes = new Map();
    this.configs = new Map();
    this.metrics = new Map();
  }

  start() {
    return new Promise((resolve) => {
      // Ajoute des nœuds de test
      this.addMockNode("localhost", {
        name: "Main Output",
        type: "playback",
        config: {
          filters: {
            Convolution: {
              description: null,
              parameters: {
                channel: 1,
                filename: "../coeffs/1 Halls 16 Amsterdam Hall  M-to-S.wav",
                type: "Wav",
              },
              type: "Conv",
            },
            Delai: {
              description: null,
              parameters: {
                delay: 20,
                subsample: false,
                unit: "ms",
              },
              type: "Delay",
            },
            Limiteur: {
              description: null,
              parameters: {
                clip_limit: -3,
                soft_clip: true,
              },
              type: "Limiter",
            },
          },
          mixers: {
            "Unnamed Mixer 1": {
              channels: {
                in: 2,
                out: 2,
              },
              description: null,
              mapping: [
                {
                  dest: 0,
                  mute: false,
                  sources: [
                    {
                      channel: 0,
                      gain: 0,
                      inverted: false,
                      mute: false,
                      scale: "dB",
                    },
                  ],
                },
                {
                  dest: 1,
                  mute: false,
                  sources: [
                    {
                      channel: 1,
                      gain: 0,
                      inverted: false,
                      mute: false,
                      scale: "dB",
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      // Simule les mises à jour de métriques
      this.metricsInterval = setInterval(() => {
        this.nodes.forEach((node, address) => {
          const metrics = {
            cpuLoad: 20 + Math.random() * 10,
            captureRate: 48000,
            captureLevel: -30 + Math.random() * 10,
            playbackRate: 48000,
            playbackLevel: -30 + Math.random() * 10,
            signalPresent: true,
            isProcessing: true,
          };
          this.metrics.set(address, metrics);
          this.io.to(address).emit("metrics", metrics);
        });
      }, 100);

      // Gestion des connexions Socket.IO
      this.io.on("connection", (socket) => {
        const address = socket.handshake.query.address;
        if (!address) return;

        console.log(`Client connected to ${address}`);
        socket.join(address);

        // Gestion des commandes
        socket.on("setconfigvalue", ({ path, value }) => {
          console.log(`Setting ${path} to ${value} for ${address}`);
          // TODO: Mettre à jour la configuration
        });

        socket.on("getconfigjson", () => {
          const config = this.configs.get(address);
          if (config) {
            socket.emit("configjson", config);
          }
        });

        socket.on("getmetrics", () => {
          const metrics = this.metrics.get(address);
          if (metrics) {
            socket.emit("metrics", metrics);
          }
        });

        socket.on("disconnect", () => {
          console.log(`Client disconnected from ${address}`);
        });
      });

      resolve();
    });
  }

  addMockNode(address, node) {
    this.nodes.set(address, node);
    this.configs.set(address, node.config);
    this.metrics.set(address, {
      cpuLoad: 25,
      captureRate: 48000,
      captureLevel: -18,
      playbackRate: 48000,
      playbackLevel: -18,
      signalPresent: true,
      isProcessing: true,
    });
  }

  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    this.io.close();
  }
}

module.exports = CamillaServerMock;
