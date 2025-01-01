import { h } from "preact";
import { CpuLoadIndicator } from "./CpuLoadIndicator";

export function NodeMetrics({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-zinc-400">
      <div className="flex items-center gap-1">
        <span>CPU:</span>
        <CpuLoadIndicator value={metrics.cpuLoad} />
      </div>
      <div className="flex items-center gap-1">
        <span>Rate:</span>
        <span>{metrics.captureRate.toFixed(1)} kHz</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Level:</span>
        <span>{metrics.captureLevel.toFixed(1)} dB</span>
      </div>
    </div>
  );
}
