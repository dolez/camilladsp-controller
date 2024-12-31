import { cn } from "../lib/utils";

export function LevelIndicator({
  value,
  color,
  vertical = false,
  className = "",
}) {
  // Convertir la valeur dB en pourcentage (0-100)
  const percent = Math.min(100, Math.max(0, (value + 60) / 0.6));

  return (
    <div
      className={`relative ${
        vertical ? "w-2" : "h-2"
      } bg-zinc-800 ${className}`}
    >
      <div
        className={`absolute ${color} ${
          vertical ? "w-full left-0 bottom-0" : "h-full left-0"
        }`}
        style={{
          [vertical ? "height" : "width"]: `${percent}%`,
        }}
      />
    </div>
  );
}
