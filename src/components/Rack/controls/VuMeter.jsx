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

export function VuMeter({ value = -60, min = -60, max = 0, className }) {
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
              backgroundColor: intensity > 0 ? baseColor : `rgb(20 20 20)`, // LED éteinte
              opacity: intensity > 0 ? 0.3 + intensity * 0.7 : 0.15,
              boxShadow:
                intensity > 0
                  ? `0 0 4px ${baseColor}, 0 0 2px ${baseColor}`
                  : "none",
              transition: "all 100ms ease-out",
            }}
          />
        );
      })}
    </div>
  );
}
