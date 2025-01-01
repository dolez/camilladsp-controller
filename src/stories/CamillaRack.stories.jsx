import React from "react";
import CamillaRack from "../components/Rack/CamillaRack";

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
  ],
};

export default meta;

// Story par défaut
export const Default = {};
