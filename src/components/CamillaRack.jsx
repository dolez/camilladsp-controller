import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button } from "./ui/Button.jsx";
import { Switch } from "./ui/Switch.jsx";
import { Alert, AlertDescription } from "./ui/Alert.jsx";
import { RackUnit } from "./RackUnit.jsx";
import { camillaManager, camillaState } from "./camilla-websocket.js";

const CamillaRack = ({ socket }) => {
  const [globalMode, setGlobalMode] = useState(false);
  // Écoute des services Avahi
  useEffect(() => {
    socket.on("avahi-services", (services) => {
      camillaManager.updateNodes(services);
    });
    return () => {
      socket.off("avahi-services");
      camillaManager.disconnectAll();
    };
  }, [socket]);

  const handleGlobalCommand = (command, value = null) => {
    const targetNodes = globalMode
      ? Array.from(camillaState.value.nodes.values())
      : Array.from(camillaState.value.selectedNodes);
    camillaManager.sendCommand(command, value, targetNodes);
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
          <Button variant="outline" onClick={() => handleGlobalCommand("Stop")}>
            Stop All
          </Button>
        </div>
      </div>

      {camillaState.value.nodes.length === 0 ? (
        <Alert>
          <AlertDescription>
            No MFA nodes found. Make sure the nodes are running and broadcasting
            via Bonjour/Avahi.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(camillaState.value.nodes.values()).map((node) => (
            <RackUnit key={node.address} node={node} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CamillaRack;
