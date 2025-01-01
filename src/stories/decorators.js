import { mockCamillaState } from "./camilla.mock";

export const withCamillaMock = (Story) => {
  // Reset mock state before each story
  mockCamillaState.value = {
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
  };

  return <Story />;
};
