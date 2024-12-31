import { Button } from "./ui/Button";
import { camillaState, camillaManager } from "./camilla-websocket.js";

export function PeakHistory({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};
  const peaks = metrics.peaks_since_start || { playback: [], capture: [] };

  const handleReset = () => {
    camillaManager.sendCommand("ResetSignalPeaksSinceStart", null, [node]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200">Peak History</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-xs"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Capture:</span>
          <span>{peaks.capture.map((p) => p.toFixed(1)).join(", ")} dB</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Playback:</span>
          <span>{peaks.playback.map((p) => p.toFixed(1)).join(", ")} dB</span>
        </div>
      </div>
    </div>
  );
}
