import { LevelIndicator } from "./LevelIndicator";
import { camillaState } from "./camilla-websocket";

export function SignalLevels({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};
  const peakHistory = metrics.peaks_since_start || {
    playback: [],
    capture: [],
  };

  // Fonction utilitaire pour convertir dB en pourcentage
  const dbToPercent = (db) => Math.min(100, Math.max(0, (db + 60) / 0.6));

  return (
    <div className="flex flex-row gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Input Levels</h3>
        <div className="flex gap-4">
          {[0, 1].map((channel) => (
            <div key={`input-${channel}`} className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">Ch {channel + 1}</div>
              <div className="flex gap-1">
                <LevelIndicator
                  vertical
                  value={metrics.capture_rms?.[channel] || 0}
                  color="bg-blue-300"
                  className="h-32"
                />
                <LevelIndicator
                  vertical
                  value={metrics.capture_peak?.[channel] || 0}
                  color="bg-blue-500"
                  className="h-32"
                />
                <div className="w-1 h-32 bg-zinc-800 relative">
                  <div
                    className="absolute w-full h-1 bg-red-500"
                    style={{
                      bottom: `${dbToPercent(
                        peakHistory.capture[channel] || 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Output Levels</h3>
        <div className="flex gap-4">
          {[0, 1].map((channel) => (
            <div key={`output-${channel}`} className="flex-1">
              <div className="text-xs text-zinc-500 mb-1">Ch {channel + 1}</div>
              <div className="flex gap-1">
                <LevelIndicator
                  vertical
                  value={metrics.playback_rms?.[channel] || 0}
                  color="bg-green-300"
                  className="h-32"
                />
                <LevelIndicator
                  vertical
                  value={metrics.playback_peak?.[channel] || 0}
                  color="bg-green-500"
                  className="h-32"
                />
                <div className="w-1 h-32 bg-zinc-800 relative">
                  <div
                    className="absolute w-full h-1 bg-red-500"
                    style={{
                      bottom: `${dbToPercent(
                        peakHistory.playback[channel] || 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
