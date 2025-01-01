import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const MuteButton = () => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <button
      onClick={toggleMute}
      className={`flex items-center justify-center p-3 rounded-full transition-colors ${
        isMuted
          ? "bg-red-500 hover:bg-red-600"
          : "bg-green-500 hover:bg-green-600"
      }`}
      aria-label={isMuted ? "Unmute" : "Mute"}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6 text-white" />
      ) : (
        <Volume2 className="w-6 h-6 text-white" />
      )}
    </button>
  );
};

export default MuteButton;
