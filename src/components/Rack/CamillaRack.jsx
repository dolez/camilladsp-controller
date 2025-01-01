import { h } from "preact";
import { useState } from "preact/hooks";
import { Button } from "../ui/Button.jsx";
import { Switch } from "../ui/Switch.jsx";
import { Alert, AlertDescription } from "../ui/Alert.jsx";
import { RackUnit } from "./RackUnit.jsx";
import { useDiscovery } from "../../hooks/useDiscovery";
import { useLinkedNodes } from "../../hooks/useLinkedNodes";

const CamillaRack = () => {
  const [globalMode, setGlobalMode] = useState(false);
  const { nodes, isScanning } = useDiscovery();
  const { linkedGroups, linkNodes, unlinkNodes } = useLinkedNodes();

  const handleGlobalCommand = (command) => {
    const targetNodes = globalMode
      ? Array.from(nodes.values())
      : Array.from(linkedGroups).find((group) => group.size > 1) || new Set();

    for (const node of targetNodes) {
      // Les commandes seront gérées par chaque RackUnit individuellement
      const event = new CustomEvent("globalCommand", {
        detail: { command, nodeAddress: node.address },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-black text-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My favorite hall</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Global Mode</span>
            <Switch checked={globalMode} onCheckedChange={setGlobalMode} />
          </div>
          <Button variant="outline" onClick={() => handleGlobalCommand("stop")}>
            Stop All
          </Button>
        </div>
      </div>

      {isScanning && (
        <Alert>
          <AlertDescription>Scanning for CamillaDSP nodes...</AlertDescription>
        </Alert>
      )}

      {!isScanning && nodes.size === 0 ? (
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
};

export default CamillaRack;
