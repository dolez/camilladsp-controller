import { signal } from "@preact/signals";

// État global pour tous les nœuds avec des valeurs par défaut correctement initialisées
export const camillaState = signal({
  selectedNodes: new Set(), // Set<string> (nodeIds)
  nodeStates: new Map(), // Map<string, NodeState>
  // Ajout d'autres propriétés nécessaires avec des valeurs par défaut
});

// Helper pour obtenir un ID unique pour un nœud
export const getNodeId = (address, port) => `${address}:${port}`;

// Helper pour accéder aux états de manière sûre
export const getNodeState = (nodeId) => {
  return (
    camillaState.value.nodeStates.get(nodeId) || {
      config: null,
      metrics: null,
      connected: false,
    }
  );
};

// Helper pour vérifier si un nœud est sélectionné
export const isNodeSelected = (nodeId) => {
  return camillaState.value.selectedNodes.has(nodeId);
};
