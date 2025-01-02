import { useEffect } from "preact/hooks";
import { camillaState } from "../services/camilla/CamillaContext";

export function useLinkedNodes() {
  const toggleNodeSelection = (nodeId) => {
    const currentState = camillaState.value;
    const updatedSelectedNodes = new Set(currentState.selectedNodes);

    if (updatedSelectedNodes.has(nodeId)) {
      updatedSelectedNodes.delete(nodeId);
    } else {
      updatedSelectedNodes.add(nodeId);
    }

    camillaState.value = {
      ...currentState,
      selectedNodes: updatedSelectedNodes,
    };
  };

  const clearSelection = () => {
    const currentState = camillaState.value;
    camillaState.value = {
      ...currentState,
      selectedNodes: new Set(),
    };
  };

  const isNodeSelected = (nodeId) => {
    return camillaState.value.selectedNodes.has(nodeId);
  };

  const getSelectedNodes = () => {
    return Array.from(camillaState.value.selectedNodes).map((nodeId) => {
      return {
        nodeId,
        state: camillaState.value.nodeStates.get(nodeId),
      };
    });
  };

  return {
    toggleNodeSelection,
    clearSelection,
    isNodeSelected,
    getSelectedNodes,
    selectedNodes: camillaState.value.selectedNodes,
  };
}
