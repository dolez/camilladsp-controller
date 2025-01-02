import io from "socket.io-client";
import { signal } from "@preact/signals";

export const discoveryState = signal({
  nodes: new Map(), // Map<string, NodeInfo>
});

export class DiscoveryClient {
  constructor() {
    this.socket = null;
    this.onNodesUpdate = null;
  }

  connect() {
    const url =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : window.location.origin;

    this.socket = io(url, {
      transports: ["websocket"],
      upgrade: false,
    });

    this.socket.on("avahi-services", (services) => {
      console.log("Received services:", services);
      discoveryState.value = {
        nodes: new Map(
          services.map((node) => [`${node.address}:${node.port}`, node])
        ),
      };

      if (this.onNodesUpdate) {
        this.onNodesUpdate(services);
      }
    });

    this.socket.on("connect", () => {
      console.log("Connected to discovery server");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Discovery server connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
