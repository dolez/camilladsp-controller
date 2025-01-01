export interface CamillaConfig {
  devices: {
    capture: Record<string, unknown>;
    playback: Record<string, unknown>;
  };
  mixers: Record<string, unknown>;
  filters: Record<string, unknown>;
  pipeline: Array<unknown>;
}

export interface CamillaMetrics {
  captureRate: number;
  playbackRate: number;
  captureLevel: number;
  playbackLevel: number;
  cpuLoad: number;
  signalPresent: boolean;
}

export interface CamillaNodeState {
  config: CamillaConfig | null;
  metrics: CamillaMetrics | null;
  isConnected: boolean;
  isProcessing: boolean;
}

export interface CamillaNode {
  address: string;
  name: string;
  state: CamillaNodeState;
}
