import { Button } from "./ui/Button";
import { Power } from "lucide-react";
import { NodeSwitch } from "./NodeSwitch";
import { NodeMetrics } from "./NodeMetrics";
import { camillaManager } from "./camilla-websocket";

export function NodeHeader({ node }) {
  const handleStop = () => camillaManager.sendCommand("Stop", null, [node]);
  const handleExit = () => camillaManager.sendCommand("Exit", null, [node]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <NodeSwitch node={node} />
        <NodeMetrics node={node} />
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={handleStop}>
          <Power size={18} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExit}>
          <Power size={18} className="text-red-500" />
        </Button>
      </div>
    </div>
  );
}
