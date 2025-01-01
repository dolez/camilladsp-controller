import { useEffect } from "react";
import { camillaState } from "../services/camilla/CamillaClient";

export function useDiscovery() {
  const { nodes, selectedNodes } = camillaState.value;

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      camillaState.value = {
        ...camillaState.value,
        selectedNodes: new Set(),
      };
    };
  }, []);

  const selectNode = (node) => {
    const newSelectedNodes = new Set(selectedNodes);
    newSelectedNodes.add(node);
    camillaState.value = {
      ...camillaState.value,
      selectedNodes: newSelectedNodes,
    };
  };

  const unselectNode = (node) => {
    const newSelectedNodes = new Set(selectedNodes);
    newSelectedNodes.delete(node);
    camillaState.value = {
      ...camillaState.value,
      selectedNodes: newSelectedNodes,
    };
  };

  return {
    nodes,
    selectedNodes,
    selectNode,
    unselectNode,
  };
}
