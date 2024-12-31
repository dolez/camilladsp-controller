import { CPULoadIndicator } from "./CpuLoadIndicator";
import { PeakHistory } from "./PeakHistory";
import { BufferStatus } from "./BufferStatus";
import { SignalLevels } from "./SignalLevels";
import { camillaState } from "./camilla-websocket";
export function MonitoringPanel({ node }) {
  return (
    <div className="space-y-4">
      <SignalLevels node={node} />
      <div className="space-y-2">
        <PeakHistory node={node} />
        <BufferStatus node={node} />
      </div>
    </div>
  );
}

function ProcessingMetrics({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};

  return (
    <div className="space-y-4">
      <CPULoadIndicator load={metrics.processingLoad || 0} />
      <div className="text-sm">
        <div>Rate Adjust: {metrics.rateAdjust || 1.0}</div>
        <div>Clipped Samples: {metrics.clippedSamples || 0}</div>
      </div>
    </div>
  );
}
