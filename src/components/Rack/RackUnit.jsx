import { h } from "preact";
import { useEffect } from "preact/hooks";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { NodeHeader } from "./NodeHeader";
import { RackControls } from "./RackControls";
import { useCamillaNode } from "../../hooks/useCamillaNode";

export function RackUnit({ node, onLink, onUnlink }) {
  const {
    config,
    metrics,
    isConnected,
    isProcessing,
    updateConfig,
    toggleProcessing,
  } = useCamillaNode(node.address);

  useEffect(() => {
    const handleGlobalCommand = (event) => {
      if (event.detail.nodeAddress === node.address) {
        switch (event.detail.command) {
          case "start":
            if (!isProcessing) toggleProcessing();
            break;
          case "stop":
            if (isProcessing) toggleProcessing();
            break;
          default:
            console.warn("Unknown command:", event.detail.command);
        }
      }
    };

    window.addEventListener("globalCommand", handleGlobalCommand);
    return () =>
      window.removeEventListener("globalCommand", handleGlobalCommand);
  }, [node.address, isProcessing, toggleProcessing]);

  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="bg-zinc-800 rounded-t-lg">
        <NodeHeader
          node={node}
          metrics={metrics}
          isConnected={isConnected}
          isProcessing={isProcessing}
          onToggleProcessing={toggleProcessing}
        />
      </CardHeader>
      <CardContent className="p-0">
        <RackControls
          config={config}
          metrics={metrics}
          onConfigChange={updateConfig}
          onLink={onLink}
          onUnlink={onUnlink}
        />
      </CardContent>
    </Card>
  );
}
