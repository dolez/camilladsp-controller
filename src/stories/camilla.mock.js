import { signal } from "@preact/signals";

// Mock du signal camillaState
export const mockCamillaState = signal({
  nodes: new Map([
    [
      "localhost",
      {
        address: "localhost",
        name: "Test Node",
        status: "connected",
      },
    ],
  ]),
  selectedNodes: new Set(),
  nodeMetrics: new Map([
    [
      "localhost",
      {
        processingLoad: 0.5,
        bufferLevel: 256,
        captureRate: 48000,
        volume: -20,
        peaks_since_start: {
          capture: [-50, -45],
          playback: [-48, -42],
        },
      },
    ],
  ]),
});

// Mock de la classe CamillaManager
export class MockCamillaManager {
  constructor() {
    this.connections = new Map();
  }

  sendCommand(command, value, nodes) {
    console.log("Mock command sent:", { command, value, nodes });
  }

  updateNodes(services) {
    console.log("Mock updating nodes:", services);
    mockCamillaState.value = {
      ...mockCamillaState.value,
      nodes: new Map(services.map((node) => [node.address, node])),
    };
  }
}
