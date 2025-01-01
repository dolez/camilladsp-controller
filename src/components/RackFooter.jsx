import React from "react";
import { VuMeter } from "./controls/VuMeter";
import { Knob } from "./controls/Knob";
import { Switch } from "./ui/Switch";

export function RackFooter({
  config,
  onConfigChange,
  inputLevels = { left: -60, right: -60, peakLeft: -60, peakRight: -60 },
  outputLevels = { left: -60, right: -60, peakLeft: -60, peakRight: -60 },
}) {
  const handleGainChange = (value) => {
    onConfigChange({
      ...config,
      mixers: {
        ...config.mixers,
        "Unnamed Mixer 1": {
          ...config.mixers["Unnamed Mixer 1"],
          mapping: config.mixers["Unnamed Mixer 1"].mapping.map((channel) => ({
            ...channel,
            sources: channel.sources.map((source) => ({
              ...source,
              gain: value,
            })),
          })),
        },
      },
    });
  };

  const handleMuteChange = (checked) => {
    onConfigChange({
      ...config,
      mixers: {
        ...config.mixers,
        "Unnamed Mixer 1": {
          ...config.mixers["Unnamed Mixer 1"],
          mapping: config.mixers["Unnamed Mixer 1"].mapping.map((channel) => ({
            ...channel,
            mute: checked,
          })),
        },
      },
    });
  };

  const currentGain =
    config.mixers?.["Unnamed Mixer 1"]?.mapping?.[0]?.sources?.[0]?.gain ?? 0;
  const isMuted =
    config.mixers?.["Unnamed Mixer 1"]?.mapping?.[0]?.mute ?? false;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 bg-zinc-800 rounded-b-lg">
      {/* VU-mètres d'entrée */}
      <div className="flex gap-1">
        <VuMeter
          label="In L"
          value={inputLevels.left}
          peak={inputLevels.peakLeft}
          orientation="horizontal"
        />
        <VuMeter
          label="In R"
          value={inputLevels.right}
          peak={inputLevels.peakRight}
          orientation="horizontal"
        />
      </div>

      {/* Contrôles du mixer */}
      <div className="flex items-end gap-4">
        <Knob
          label="Gain"
          value={currentGain}
          onChange={handleGainChange}
          min={-60}
          max={20}
          step={0.1}
          unit="dB"
          size="sm"
        />
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs text-zinc-400">Mute</div>
          <Switch
            checked={isMuted}
            onCheckedChange={handleMuteChange}
            className="data-[state=checked]:bg-red-500"
          />
        </div>
      </div>

      {/* VU-mètres de sortie */}
      <div className="flex gap-1">
        <VuMeter
          label="Out L"
          value={outputLevels.left}
          peak={outputLevels.peakLeft}
          orientation="horizontal"
        />
        <VuMeter
          label="Out R"
          value={outputLevels.right}
          peak={outputLevels.peakRight}
          orientation="horizontal"
        />
      </div>
    </div>
  );
}
