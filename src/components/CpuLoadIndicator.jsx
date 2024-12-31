import { cn } from "../lib/utils";

export function CPULoadIndicator({ load }) {
  const getLoadColor = (loadValue) => {
    if (loadValue < 50) return "bg-green-500";
    if (loadValue < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="text-xs text-zinc-400 flex justify-between">
        <span>CPU Load</span>
        <span>{load.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all", getLoadColor(load))}
          style={{ width: `${Math.min(100, load)}%` }}
        />
      </div>
    </div>
  );
}
