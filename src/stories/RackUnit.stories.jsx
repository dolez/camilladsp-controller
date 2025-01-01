import React from "react";
import { fn } from "@storybook/test";
import { RackUnit } from "../components/Rack/RackUnit";

// Configuration complète de test
const defaultNode = {
  address: "192.168.1.100",
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
  args: {
    node: defaultNode,
    onLink: fn(),
    onUnlink: fn(),
  },
};

export default meta;

// Story par défaut
export const Default = {};

// Story avec état "Disconnected"
export const Disconnected = {
  args: {
    node: {
      ...defaultNode,
      address: "192.168.1.200", // Adresse qui n'existe pas dans le mock
    },
  },
};
