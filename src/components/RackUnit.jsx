import { Card, CardHeader, CardContent } from "../components/ui/Card";
import { NodeHeader } from "./NodeHeader";
import { RackControls } from "./RackControls";

export function RackUnit({ node, onConfigChange }) {
  const handleConfigChange = (newConfig) => {
    // Appelle le callback parent s'il existe, sinon log
    if (onConfigChange) {
      onConfigChange(newConfig);
    } else {
      console.log("New config:", newConfig);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="bg-zinc-800 rounded-t-lg">
        <NodeHeader node={node} />
      </CardHeader>
      <CardContent className="p-0">
        <RackControls
          config={node.config}
          onConfigChange={handleConfigChange}
        />
      </CardContent>
    </Card>
  );
}
