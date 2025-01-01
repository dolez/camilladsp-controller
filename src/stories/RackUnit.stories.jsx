import React, { useState, useCallback } from "react";
import { RackUnit } from "../components/RackUnit";
import { mockNodeMetrics } from "./mocks/useNodeMetrics.mock";
import { MockContext } from "./mocks/MockContext";

// Configuration complète de test
const defaultNode = {
  address: "test-node",
  name: "Test Node",
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
      "Passe bas d'entrée": {
        description: null,
        parameters: {
          freq: 800,
          order: 2,
          type: "ButterworthLowpass",
        },
        type: "BiquadCombo",
      },
      "Passe bas de sortie": {
        description: null,
        parameters: {
          freq: 2000,
          order: 2,
          type: "ButterworthLowpass",
        },
        type: "BiquadCombo",
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
};

const withMockMetrics = (metrics) => (Story) => {
  const useNodeMetrics = () => metrics;
  return (
    <MockContext.Provider value={{ useNodeMetrics }}>
      <Story />
    </MockContext.Provider>
  );
};

// Décorateur pour le container
const withContainer = (Story) => (
  <div style={{ width: "800px", margin: "1rem" }}>
    <Story />
  </div>
);

const meta = {
  title: "Components/RackUnit",
  component: RackUnit,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [withContainer],
};

export default meta;

// Wrapper pour gérer l'état
const InteractiveRackUnit = ({ node: initialNode, metrics }) => {
  const [node, setNode] = useState(initialNode);

  const handleConfigChange = useCallback((newConfig) => {
    console.log("Config change in InteractiveRackUnit:", newConfig);
    setNode((prev) => ({
      ...prev,
      config: newConfig,
    }));
  }, []);

  return <RackUnit node={node} onConfigChange={handleConfigChange} />;
};

// Story par défaut avec état "Running"
export const Running = {
  render: () => (
    <InteractiveRackUnit
      node={defaultNode}
      metrics={{ ...mockNodeMetrics, state: "Running" }}
    />
  ),
  decorators: [withMockMetrics({ ...mockNodeMetrics, state: "Running" })],
};

// Story avec état "Paused"
export const Paused = {
  render: () => (
    <InteractiveRackUnit
      node={defaultNode}
      metrics={{ ...mockNodeMetrics, state: "Paused" }}
    />
  ),
  decorators: [withMockMetrics({ ...mockNodeMetrics, state: "Paused" })],
};

// Story avec état "Failed"
export const Failed = {
  render: () => (
    <InteractiveRackUnit
      node={defaultNode}
      metrics={{ ...mockNodeMetrics, state: "Failed" }}
    />
  ),
  decorators: [withMockMetrics({ ...mockNodeMetrics, state: "Failed" })],
};
