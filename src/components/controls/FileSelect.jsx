import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { FileIcon } from "lucide-react";

export function FileSelect({ value, onChange, label, className }) {
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);

  const handleClick = () => {
    // Simulation d'une sélection de fichier
    console.log("FileSelect click:", { label, currentValue: value });
    const newValue = prompt("Entrer le chemin du fichier:", value);
    if (newValue && newValue !== value) {
      console.log("FileSelect change:", { oldValue: value, newValue });
      onChange(newValue);
    }
  };

  useEffect(() => {
    if (isHovered && textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        const duration = textWidth / 30; // Vitesse ajustée
        textRef.current.style.animation = `scroll ${duration}s linear infinite`;
      }
    } else if (textRef.current) {
      textRef.current.style.animation = "none";
    }
  }, [isHovered]);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <div className="text-xs text-zinc-400 h-4">{label}</div>}
      <Button
        variant="outline"
        size="icon"
        className="w-12 h-12 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
        onClick={handleClick}
      >
        <FileIcon className="w-5 h-5" />
      </Button>
      <div
        ref={containerRef}
        className="w-12 text-xs text-zinc-400 text-center overflow-hidden relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={textRef}
          className="whitespace-nowrap inline-block"
          style={{
            animation: "none",
          }}
          title={value}
        >
          {value?.split("/").pop() || "Aucun fichier"}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% + 48px));
          }
        }
      `}</style>
    </div>
  );
}
