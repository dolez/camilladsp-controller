import { h } from "preact";
import { cn } from "../../../lib/utils";

const LED_CONFIG = [
  { threshold: 0.0, color: "green" }, // LED 1 (bas)
  { threshold: 0.2, color: "green" }, // LED 2
  { threshold: 0.4, color: "green" }, // LED 3
  { threshold: 0.6, color: "green" }, // LED 4
  { threshold: 0.75, color: "yellow" }, // LED 5
  { threshold: 0.9, color: "red" }, // LED 6 (haut)
];

function SingleVuMeter({ value = -60, min = -60, max = 0, className }) {
  // Normalise la valeur entre 0 et 1
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <div className={cn("flex flex-col-reverse gap-0.5", className)}>
      {LED_CONFIG.map((led, i) => {
        // Calcule l'intensité de la LED
        const intensity =
          normalizedValue >= led.threshold
            ? Math.min(1, (normalizedValue - led.threshold) / 0.2) // 0.2 = fenêtre de transition
            : 0;

        const baseColor = {
          green: "rgb(22 163 74)", // green-600
          yellow: "rgb(202 138 4)", // yellow-600
          red: "rgb(220 38 38)", // red-600
        }[led.color];

        return (
          <div
            key={i}
            className="w-2 h-2 rounded-sm"
            style={{
              backgroundColor: baseColor, // LED éteinte plus visible
              opacity: intensity > 0 ? 0.3 + intensity * 0.7 : 0.3, // Opacité augmentée pour les LEDs éteintes
              boxShadow:
                intensity > 0
                  ? `0 0 4px ${baseColor}, 0 0 2px ${baseColor}`
                  : "inset 0 0 1px ${baseColor}", // Ajout d'une bordure subtile
              transition: "all 100ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}

export function VuMeter({
  values = [-60, -60],
  min = -60,
  max = 0,
  className,
}) {
  // Si une seule valeur est fournie, la dupliquer pour le stéréo
  const [leftValue, rightValue] = Array.isArray(values)
    ? values
    : [values, values];

  return (
    <div className="flex gap-1">
      <SingleVuMeter
        value={leftValue}
        min={min}
        max={max}
        className={className}
      />
      <SingleVuMeter
        value={rightValue}
        min={min}
        max={max}
        className={className}
      />
    </div>
  );
}
