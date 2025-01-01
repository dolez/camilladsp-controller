import { h } from "preact";
import { useState } from "preact/hooks";
import { Button } from "../../ui/Button";
import { Volume2Icon, VolumeXIcon } from "lucide-react";

export function MuteButton({ disabled = false }) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Button
      variant="outline"
      size="icon"
      disabled={disabled}
      onClick={() => setIsMuted(!isMuted)}
      className="w-8 h-8 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 disabled:opacity-50"
    >
      {isMuted ? (
        <VolumeXIcon className="w-4 h-4 text-red-500" />
      ) : (
        <Volume2Icon className="w-4 h-4" />
      )}
    </Button>
  );
}
