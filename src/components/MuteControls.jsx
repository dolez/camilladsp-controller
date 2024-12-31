import { Button } from "./ui/Button";
import { camillaManager } from "./camilla-websocket";
import { camillaState } from "./camilla-websocket";

export function MuteControls({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};

  // État de mute pour les différents faders
  const mainMute = metrics.mainMute || false;
  const faderMutes = metrics.faderMutes || new Array(4).fill(false);

  const handleMainMute = () => {
    camillaManager.sendCommand("SetMute", !mainMute, [node]);
  };

  const handleFaderMute = (fader) => {
    camillaManager.sendCommand(
      "SetFaderMute",
      [fader, !faderMutes[fader - 1]],
      [node]
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Mute Controls</h3>

      {/* Main Mute */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Main</span>
        <Button
          variant={mainMute ? "destructive" : "secondary"}
          size="sm"
          onClick={handleMainMute}
          className="w-20"
        >
          {mainMute ? "Muted" : "Unmuted"}
        </Button>
      </div>

      {/* Fader Mutes */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((fader) => (
          <div key={fader} className="flex items-center justify-between">
            <span className="text-sm">Aux {fader}</span>
            <Button
              variant={faderMutes[fader - 1] ? "destructive" : "secondary"}
              size="sm"
              onClick={() => handleFaderMute(fader)}
              className="w-20"
            >
              {faderMutes[fader - 1] ? "Muted" : "Unmuted"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
