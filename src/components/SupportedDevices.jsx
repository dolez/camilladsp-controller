import { Badge } from "./ui/Badge";
import { camillaState } from "./camilla-websocket";
import { useState, useEffect } from "react";

export function SupportedDevices({ node }) {
  const [deviceTypes, setDeviceTypes] = useState(null);

  useEffect(() => {
    const metrics = camillaState.value.nodeMetrics.get(node.address);
    if (metrics?.supportedDeviceTypes) {
      const [playback, capture] = metrics.supportedDeviceTypes;
      setDeviceTypes({
        playback,
        capture,
      });
    }
  }, [node.address, camillaState.value.nodeMetrics]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Supported Devices</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <h4 className="text-zinc-400">Playback</h4>
          {deviceTypes?.playback ? (
            <div className="space-y-1">
              {deviceTypes.playback.map((type) => (
                <Badge key={type} variant="outline" className="mr-1">
                  {type}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-zinc-500 text-xs">Loading...</span>
          )}
        </div>
        <div className="space-y-1">
          <h4 className="text-zinc-400">Capture</h4>
          {deviceTypes?.capture ? (
            <div className="space-y-1">
              {deviceTypes.capture.map((type) => (
                <Badge key={type} variant="outline" className="mr-1">
                  {type}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-zinc-500 text-xs">Loading...</span>
          )}
        </div>
      </div>
    </div>
  );
}
