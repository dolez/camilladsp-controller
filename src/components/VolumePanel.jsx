import { camillaManager, camillaState } from "./camilla-websocket";
import { Volume2 } from "lucide-react";
import { Slider } from "./ui/Slider";
import { MuteControls } from "./MuteControls";

export function VolumePanel({ node }) {
  return (
    <div className="space-y-6">
      <MainVolume node={node} />
      <FaderControls node={node} />
      <MuteControls node={node} />
    </div>
  );
}

function MainVolume({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};

  const handleVolumeChange = (values) => {
    camillaManager.sendCommand("SetVolume", values[0], [node]);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Main Volume</h3>
      <div className="flex items-center gap-4">
        <Volume2 size={18} />
        <Slider
          defaultValue={[metrics.volume || 0]}
          min={-100}
          max={0}
          step={0.1}
          className="flex-1"
          onValueChange={handleVolumeChange}
        />
        <span className="text-sm w-12 text-right">
          {metrics.volume?.toFixed(1) || 0}dB
        </span>
      </div>
    </div>
  );
}

function FaderControls({ node }) {
  const handleFaderVolume = (fader, value) => {
    camillaManager.sendCommand("SetFaderVolume", [fader, value], [node]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Faders</h3>
      {[1, 2, 3, 4].map((fader) => (
        <div key={fader} className="flex items-center gap-4">
          <span className="text-sm w-16">Aux {fader}</span>
          <Slider
            defaultValue={[0]}
            min={-100}
            max={0}
            step={0.1}
            className="flex-1"
            onValueChange={(values) => handleFaderVolume(fader, values[0])}
          />
        </div>
      ))}
    </div>
  );
}
