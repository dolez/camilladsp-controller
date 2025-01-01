import { NodeSwitch } from "./NodeSwitch";
import { NodeMetrics } from "./NodeMetrics";
import MuteButton from "./MuteButton";

export function NodeHeader({ node }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <NodeSwitch node={node} />
        <NodeMetrics node={node} />
      </div>
      <div className="flex gap-2">
        <MuteButton />
      </div>
    </div>
  );
}
