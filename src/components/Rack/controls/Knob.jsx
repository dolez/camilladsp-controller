import { h } from "preact";
import { cn } from "../../../lib/utils";

export function Knob({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = "md",
  label,
  unit = "",
  className,
}) {
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  // Vérification des props
  if (typeof value !== "number") {
    console.warn("Knob: value is not a number", { label, value });
    return null;
  }

  const sizes = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  // Calcul de l'angle de rotation (de -135° à +135°)
  const rotation = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {label && <div className="text-xs text-zinc-400 h-4">{label}</div>}
      <div className={cn("relative", sizes[size])}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="knob absolute w-full h-full opacity-0 cursor-pointer"
        />
        <div className="pointer-events-none absolute inset-0 bg-zinc-800 rounded-full border border-zinc-700">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 w-1 h-1/3 bg-blue-500 origin-bottom rounded-full"
            style={{
              transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>
      <div className="text-xs text-zinc-400 text-center">
        {value.toFixed(step < 1 ? 1 : 0)}
        {unit && ` ${unit}`}
      </div>
    </div>
  );
}
