import { h } from "preact";
import { cn } from "../../lib/utils";

export function CpuLoadIndicator({ value }) {
  const getColor = (load) => {
    if (load >= 80) return "text-red-500";
    if (load >= 50) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <span className={cn("font-medium", getColor(value))}>
      {value.toFixed(1)}%
    </span>
  );
}
