import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";

const CamillaController = ({ socket }) => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [volume, setVolume] = useState(0);
  const [vuMeterData, setVuMeterData] = useState({ input: [], output: [] });

  useEffect(() => {
    // Écoute des services Avahi
    socket.on("avahi-services", (services) => {
      setNodes(services);
    });

    return () => {
      socket.off("avahi-services");
    };
  }, [socket]);

  // Connexion WebSocket directe à CamillaDSP pour les VU-mètres
  useEffect(() => {
    if (!selectedNode) return;

    const camillaWs = new WebSocket(`ws://${selectedNode.address}:1234/ws`);

    camillaWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "vu_meter") {
        setVuMeterData(data.values);
      }
    };

    return () => camillaWs.close();
  }, [selectedNode]);

  const broadcastCommand = (command) => {
    nodes.forEach((node) => {
      const ws = new WebSocket(`ws://${node.address}:1234/ws`);
      ws.onopen = () => {
        ws.send(JSON.stringify(command));
        ws.close();
      };
    });
  };

  const handleVolumeChange = (newValue) => {
    setVolume(newValue);
    broadcastCommand({
      type: "volume",
      value: newValue,
    });
  };

  const loadConfig = (config) => {
    broadcastCommand({
      type: "load_config",
      config: config,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>CamillaDSP Controller</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Liste des nœuds */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Nodes disponibles</h3>
              {nodes.map((node) => (
                <Button
                  key={node.name}
                  variant={
                    selectedNode?.name === node.name ? "default" : "outline"
                  }
                  className="w-full"
                  onClick={() => setSelectedNode(node)}
                >
                  {node.name} ({node.address})
                </Button>
              ))}
            </div>

            {/* Contrôles */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Volume</h3>
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => handleVolumeChange(value)}
                  max={100}
                  step={1}
                />
              </div>

              <Button
                onClick={() =>
                  loadConfig({
                    /* votre config par défaut */
                  })
                }
                className="w-full"
              >
                Load Default Config
              </Button>
            </div>
          </div>

          {/* VU-mètres */}
          {selectedNode && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">VU Meters</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm">Input:</span>
                  <div className="h-4 bg-gray-200 rounded">
                    <div
                      className="h-full bg-blue-500 rounded transition-all"
                      style={{
                        width: `${Math.min(100, vuMeterData.input[0] || 0)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <span className="text-sm">Output:</span>
                  <div className="h-4 bg-gray-200 rounded">
                    <div
                      className="h-full bg-green-500 rounded transition-all"
                      style={{
                        width: `${Math.min(100, vuMeterData.output[0] || 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interface web CamillaDSP */}
          {selectedNode && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Interface Web</h3>
              <iframe
                src={`http://${selectedNode.address}:5005`}
                className="w-full h-96 border rounded"
                title="CamillaDSP Interface"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CamillaController;
