import { useState } from "preact/hooks";
import { RackUnit } from "./RackUnit";
import { Alert } from "../ui/Alert";
import { AlertDescription } from "../ui/Alert";
import { useLinkedNodes } from "../../hooks/useLinkedNodes";
import { useDiscovery } from "../../hooks/useDiscovery";
import { getNodeId } from "../../services/camilla/CamillaContext";

export function CamillaRack() {
  const { nodes } = useDiscovery();
  const [globalMode, setGlobalMode] = useState(false);
  const { toggleNodeSelection } = useLinkedNodes();

  return (
    <div className="p-6 space-y-6 bg-black text-white min-h-screen">
      <div className="flex justify-end">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={globalMode}
            onChange={(e) => setGlobalMode(e.target.checked)}
          />
          <span>Mode global</span>
        </label>
      </div>

      {!nodes || nodes.size === 0 ? (
        <Alert>
          <AlertDescription>
            No CamillaDSP nodes found. Make sure the nodes are running and
            broadcasting via Bonjour/Avahi.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
          {Array.from(nodes.values()).map((node) => (
            <RackUnit
              key={getNodeId(node.address, node.port)}
              node={node}
              globalMode={globalMode}
              onSelect={() =>
                toggleNodeSelection(getNodeId(node.address, node.port))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
