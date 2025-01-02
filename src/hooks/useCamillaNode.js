import { useEffect, useRef } from "preact/hooks";
import { signal } from "@preact/signals";
import { CamillaClient } from "../services/camilla/CamillaClient";
import { camillaState, getNodeId } from "../services/camilla/CamillaContext";

// État local pour chaque nœud
export const createNodeState = () =>
  signal({
    config: null,
    metrics: null,
    connected: false,
  });

export function useCamillaNode(address, port) {
  const clientRef = useRef(null);
  const nodeState = useRef(createNodeState()).current;
  const nodeId = getNodeId(address, port);

  useEffect(() => {
    const client = new CamillaClient(address, port);
    clientRef.current = client;

    // Mettre à jour l'état local et global
    const updateState = (newState) => {
      nodeState.value = newState;

      const currentState = camillaState.value;
      const updatedNodeStates = new Map(currentState.nodeStates);
      updatedNodeStates.set(nodeId, newState);

      camillaState.value = {
        ...currentState,
        nodeStates: updatedNodeStates,
      };
    };

    client.onMetrics = (metrics) => {
      updateState({
        ...nodeState.value,
        metrics,
      });
    };

    client.onConfig = (config) => {
      console.log("onConfig", config);
      updateState({
        ...nodeState.value,
        config,
      });
    };

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;

      // Nettoyer l'état global lors de la déconnexion
      const currentState = camillaState.value;
      const updatedNodeStates = new Map(currentState.nodeStates);
      updatedNodeStates.delete(nodeId);

      camillaState.value = {
        ...currentState,
        nodeStates: updatedNodeStates,
      };
    };
  }, [address, port, nodeId]);

  // Fonctions utilitaires exposées au composant
  const setFilterParam = (filterName, paramName, value) => {
    clientRef.current?.setFilterParam(filterName, paramName, value);
  };

  const setMixerGain = (mixerName, destIndex, sourceIndex, gain) => {
    clientRef.current?.setMixerGain(mixerName, destIndex, sourceIndex, gain);
  };

  const setFilterBypass = (pipelineIndex, bypassed) => {
    clientRef.current?.setFilterBypass(pipelineIndex, bypassed);
  };

  return {
    state: nodeState.value,
    nodeId,
    setFilterParam,
    setMixerGain,
    setFilterBypass,
  };
}
