import { signal } from "@preact/signals";

export const discoveryState = signal({
  nodes: new Map(), // Map<string, NodeInfo>
});

export class DiscoveryClient {
  constructor() {
    this.eventSource = null;
    this.onNodesUpdate = null;
  }

  async connect() {
    try {
      // Récupération initiale des noeuds
      const response = await fetch(`/api/nodes`);
      const data = await response.json();
      this.updateNodes(data.nodes.filter((n) => n.interface === "wlan0"));

      // Mise en place de l'écoute SSE
      this.eventSource = new EventSource(`/api/events`);

      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.event === "connected" && data.interface === "wlan0") {
          const nodeKey = `${data.ip}`;
          const nodes = new Map(discoveryState.value.nodes);
          nodes.set(nodeKey, {
            name: data.name,
            address: data.ip,
            port: data.port,
            host: data.host,
          });
          discoveryState.value = { nodes };
        } else if (data.event === "disconnected") {
          const nodes = new Map(discoveryState.value.nodes);
          // On cherche le noeud par son nom car on n'a pas l'IP dans l'événement de déconnexion
          for (const [key, node] of nodes.entries()) {
            if (node.name === data.name) {
              nodes.delete(key);
              break;
            }
          }
          discoveryState.value = { nodes };
        }

        if (this.onNodesUpdate) {
          this.onNodesUpdate(Array.from(discoveryState.value.nodes.values()));
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
      };
    } catch (error) {
      console.error("Failed to initialize discovery client:", error);
    }
  }

  updateNodes(nodes) {
    const nodesMap = new Map(
      nodes.map((node) => [
        node.ip,
        {
          name: node.name,
          address: node.ip,
          port: node.port,
          host: node.host,
        },
      ])
    );
    discoveryState.value = { nodes: nodesMap };

    if (this.onNodesUpdate) {
      this.onNodesUpdate(Array.from(nodesMap.values()));
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
