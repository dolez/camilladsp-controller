import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SupportedDevices } from "./SupportedDevices";
import { camillaManager, camillaState } from "./camilla-websocket";

export function DevicePanel({ node }) {
  return (
    <div className="space-y-4">
      <DeviceInfo node={node} />
      <SupportedDevices node={node} />
      <UpdateInterval node={node} />
    </div>
  );
}

function DeviceInfo({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};

  return (
    <div className="space-y-2 text-sm">
      <div>
        Capture Rate:{" "}
        {metrics.captureRate ? `${metrics.captureRate} Hz` : "Unknown"}
      </div>
      <div>Buffer Level: {metrics.bufferLevel || 0} frames</div>
      <div>State File: {metrics.stateFilePath || "Not set"}</div>
    </div>
  );
}

function UpdateInterval({ node }) {
  const [interval, setInterval] = useState(100);

  const handleUpdate = () => {
    camillaManager.sendCommand("SetUpdateInterval", interval, [node]);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Update Interval</h3>
      <div className="flex gap-2">
        <Input
          type="number"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm self-center">ms</span>
        <Button variant="secondary" size="sm" onClick={handleUpdate}>
          Apply
        </Button>
      </div>
    </div>
  );
}
