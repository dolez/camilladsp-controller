import { camillaState } from "./camilla-websocket.js";

export function BufferStatus({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};
  const bufferLevel = metrics.bufferLevel || 0;
  const rateAdjust = metrics.rateAdjust || 1.0;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-200">Buffer Status</h3>

      <div className="flex gap-4 text-xs text-zinc-400">
        <div className="flex-1">
          <div className="h-2 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{
                width: `${Math.min(100, (bufferLevel / 8192) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <span>Buffer: {bufferLevel} frames</span>
            <span>Rate: {rateAdjust.toFixed(3)}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}
