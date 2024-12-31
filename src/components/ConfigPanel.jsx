import { Button } from "./ui/Button";
import { camillaManager, camillaState } from "./camilla-websocket";
import { RefreshCw, FileText, Activity } from "lucide-react";
export function ConfigPanel({ node }) {
  const handleReload = () => camillaManager.sendCommand("Reload", null, [node]);
  const handleGetConfig = () =>
    camillaManager.sendCommand("GetConfig", null, [node]);
  const handleValidateConfig = () =>
    camillaManager.sendCommand("ValidateConfig", null, [node]);

  return (
    <div className="space-y-4">
      <ConfigInfo node={node} />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleReload}>
          <RefreshCw size={14} className="mr-1" />
          Reload
        </Button>
        <Button variant="secondary" size="sm" onClick={handleGetConfig}>
          <FileText size={14} className="mr-1" />
          Get Config
        </Button>
        <Button variant="secondary" size="sm" onClick={handleValidateConfig}>
          <Activity size={14} className="mr-1" />
          Validate
        </Button>
      </div>
    </div>
  );
}

function ConfigInfo({ node }) {
  const metrics = camillaState.value.nodeMetrics.get(node.address) || {};

  return (
    <div className="space-y-2 text-sm">
      <div>Title: {metrics.configTitle || "Not set"}</div>
      <div>Description: {metrics.configDescription || "Not set"}</div>
      <div>Path: {metrics.configFilePath || "Not set"}</div>
    </div>
  );
}
