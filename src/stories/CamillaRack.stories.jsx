import React from "react";
import CamillaRack from "../components/CamillaRack";
import { mockNodeMetrics } from "./mocks/useNodeMetrics.mock";
import { MockContext } from "./mocks/MockContext";

// Configuration de test avec plusieurs nodes
const defaultNodes = [
  {
    address: "playback-1",
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
  },
  {
    address: "playback-2",
    name: "Monitoring",
    type: "playback",
    config: {
      filters: {
        Convolution: {
          description: null,
          parameters: {
            channel: 1,
            filename: "../coeffs/2 Halls 16 Berlin Hall  M-to-S.wav",
            type: "Wav",
          },
          type: "Conv",
        },
        Delai: {
          description: null,
          parameters: {
            delay: 30,
            subsample: false,
            unit: "ms",
          },
          type: "Delay",
        },
        Limiteur: {
          description: null,
          parameters: {
            clip_limit: -6,
            soft_clip: true,
          },
          type: "Limiter",
        },
        "Passe bas d'entrée": {
          description: null,
          parameters: {
            freq: 1200,
            order: 2,
            type: "ButterworthLowpass",
          },
          type: "BiquadCombo",
        },
        "Passe bas de sortie": {
          description: null,
          parameters: {
            freq: 1800,
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
                  gain: -3,
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
                  gain: -3,
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
  },
];

const withMockMetrics = (Story) => {
  const useNodeMetrics = () => ({
    ...mockNodeMetrics,
    state: "Running",
  });
  return (
    <MockContext.Provider value={{ useNodeMetrics }}>
      <Story />
    </MockContext.Provider>
  );
};

const meta = {
  title: "App/CamillaRack",
  component: CamillaRack,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-zinc-950 p-8">
        <Story />
      </div>
    ),
    withMockMetrics,
  ],
};

export default meta;

// Story par défaut
export const Default = {
  args: {
    nodes: defaultNodes,
  },
};
