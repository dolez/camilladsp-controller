import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import { Button } from "../../ui/Button";
import { FileIcon, UploadIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/Select";
import { getNodeId } from "../../../services/camilla/CamillaContext";

export function ConvolutionFileSelect({
  value,
  onChange,
  node,
  label,
  className,
  files = [],
  onUploadSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const nodeId = getNodeId(node.address, node.port);

  useEffect(() => {
    if (isHovered && textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        const duration = textWidth / 30; // Vitesse de défilement ajustée
        textRef.current.style.animation = `scroll ${duration}s linear infinite`;
      }
    } else if (textRef.current) {
      textRef.current.style.animation = "none";
    }
  }, [isHovered, value]);

  const formatFilePath = (filename) => {
    return `/home/pi/camilladsp/coeffs/${filename}`;
  };

  const handleFileSelect = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".wav,.txt";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        setIsLoading(true);
        const response = await fetch(`/api/upload/${nodeId}`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          onChange(formatFilePath(file.name));
          if (onUploadSuccess) {
            await onUploadSuccess();
          }
        } else {
          console.error("Erreur lors de l'upload");
        }
      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fileInput.click();
  };

  const handleValueChange = (filename) => {
    onChange(formatFilePath(filename));
  };

  const displayValue = value?.split("/").pop() || "";

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {label && <div className="text-xs text-zinc-400 h-4">{label}</div>}
      <div className="flex gap-2">
        <Select value={displayValue} onValueChange={handleValueChange}>
          <SelectTrigger className="w-12 h-12 p-0">
            <FileIcon className="w-5 h-5" />
          </SelectTrigger>
          <SelectContent>
            {files.map((file) => (
              <SelectItem key={file} value={file}>
                {file}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          onClick={handleFileSelect}
          disabled={isLoading}
        >
          <UploadIcon className="w-5 h-5" />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="w-24 text-xs text-zinc-400 text-center overflow-hidden relative"
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
          {displayValue || "Aucun fichier"}
        </div>
      </div>
      <style>{`
        @keyframes scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-100% - 48px));
          }
        }
      `}</style>
    </div>
  );
}
