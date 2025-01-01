import { CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/utils";
import { useNodeMetrics } from "../hooks/useNodeMetrics";

export function NodeMetrics({ node }) {
  const metrics = useNodeMetrics(node);

  const getStateColor = (state) => {
    switch (state) {
      case "Running":
        return "text-green-500";
      case "Paused":
        return "text-yellow-500";
      case "Failed":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <CardTitle className="text-base text-zinc-100">{node.name}</CardTitle>
      {metrics.state && (
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-xs font-medium",
            getStateColor(metrics.state)
          )}
        >
          {metrics.state}
        </Badge>
      )}
    </div>
  );
}
