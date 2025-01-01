import { h } from "preact";
import { NodeSwitch } from "./NodeSwitch";
import { NodeMetrics } from "./NodeMetrics";
import { MuteButton } from "./controls/MuteButton";
import { Badge } from "../ui/Badge";

export function NodeHeader({
  node,
  isConnected,
  isProcessing,
  onToggleProcessing,
  metrics,
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <NodeSwitch
          isProcessing={isProcessing}
          onToggle={onToggleProcessing}
          disabled={!isConnected}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{node.name}</span>
            {!isConnected && (
              <Badge variant="destructive" className="text-xs">
                Disconnected
              </Badge>
            )}
          </div>
          <NodeMetrics metrics={metrics} />
        </div>
      </div>
      <div className="flex gap-2">
        <MuteButton disabled={!isConnected} />
      </div>
    </div>
  );
}
