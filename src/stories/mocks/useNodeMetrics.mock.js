export const mockNodeMetrics = {
  state: "Running",
  bufferUnderrun: 0,
  bufferOverrun: 0,
  captureState: "Active",
  playbackState: "Active",
  sampleRate: 48000,
  signalRange: {
    max: -12,
    min: -60,
  },
  nodeMetrics: new Map([
    [
      "playback-1",
      {
        state: "Running",
        inputLevels: { left: -28, right: -25 },
        outputLevels: { left: -35, right: -32 },
      },
    ],
    [
      "playback-2",
      {
        state: "Running",
        inputLevels: { left: -32, right: -30 },
        outputLevels: { left: -38, right: -36 },
      },
    ],
  ]),
};

// Fonction mock simple qui retourne les métriques
export const mockUseNodeMetrics =
  (metrics = mockNodeMetrics) =>
  () =>
    metrics;
