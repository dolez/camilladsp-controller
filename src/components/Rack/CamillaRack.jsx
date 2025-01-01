import { useContext, useState } from "react";
import { RackUnit } from "./RackUnit";
import { DiscoveryContext } from "../../services/discovery/DiscoveryContext";
import { Alert } from "../ui/Alert";
import { AlertDescription } from "../ui/Alert";
import { useLinkedNodes } from "../../hooks/useLinkedNodes";

export function CamillaRack() {
  const { nodes } = useContext(DiscoveryContext);
  const [globalMode, setGlobalMode] = useState(false);
  const { linkedGroups, linkNodes, unlinkNodes } = useLinkedNodes();

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

      {nodes.size === 0 ? (
        <Alert>
          <AlertDescription>
            No CamillaDSP nodes found. Make sure the nodes are running and
            broadcasting via Bonjour/Avahi.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(nodes.values()).map((node) => (
            <RackUnit
              key={node.address}
              node={node}
              globalMode={globalMode}
              onLink={(addresses) => linkNodes([node.address, ...addresses])}
              onUnlink={(addresses) =>
                unlinkNodes([node.address, ...addresses])
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
