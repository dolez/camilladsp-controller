import { h } from "preact";
import { useEffect } from "preact/hooks";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { NodeHeader } from "./NodeHeader";
import { RackControls } from "./RackControls";
import { useCamillaNode } from "../../hooks/useCamillaNode";
import { getNodeId } from "../../services/camilla/CamillaContext";

export function RackUnit({ node, globalMode, onSelect }) {
  const { state, setFilterParam, setMixerGain, setFilterBypass } =
    useCamillaNode(node.address, node.port);

  const { config, metrics, connected: isConnected } = state;

  useEffect(() => {
    const handleGlobalCommand = (event) => {
      if (event.detail.nodeAddress === node.address) {
        switch (event.detail.command) {
          case "start":
            // Adapter ces actions aux nouvelles méthodes si nécessaire
            break;
          case "stop":
            // Adapter ces actions aux nouvelles méthodes si nécessaire
            break;
          default:
            console.warn("Unknown command:", event.detail.command);
        }
      }
    };

    window.addEventListener("globalCommand", handleGlobalCommand);
    return () =>
      window.removeEventListener("globalCommand", handleGlobalCommand);
  }, [node.address]);

  const updateConfig = (path, value) => {
    setFilterParam(path, value);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="bg-zinc-800 rounded-t-lg">
        <NodeHeader
          node={node}
          metrics={metrics}
          isConnected={isConnected}
          onSelect={onSelect}
        />
      </CardHeader>
      <CardContent className="p-0">
        <RackControls
          config={config}
          metrics={metrics}
          onConfigChange={updateConfig}
          setMixerGain={setMixerGain}
          setFilterBypass={setFilterBypass}
        />
      </CardContent>
    </Card>
  );
}
