import { useEffect, useRef } from "preact/hooks";
import { signal } from "@preact/signals";
import { CamillaClient } from "../services/camilla/CamillaClient";
import { camillaState, getNodeId } from "../services/camilla/CamillaContext";

// État local pour chaque nœud
export const createNodeState = () =>
  signal({
    config: null,
    metrics: {
      captureRms: null,
      playbackRms: null,
      cpuLoad: 0,
      captureRate: 0,
      captureLevel: -100,
    },
    connected: false,
  });

export function useCamillaNode(address, port) {
  const clientRef = useRef(null);
  const nodeState = useRef(createNodeState()).current;
  const nodeId = getNodeId(address, port);

  // Mettre à jour l'état local et global
  const updateState = (newState) => {
    nodeState.value = {
      ...nodeState.value,
      ...newState,
    };

    const currentState = camillaState.value;
    const updatedNodeStates = new Map(currentState.nodeStates);
    updatedNodeStates.set(nodeId, nodeState.value);

    camillaState.value = {
      ...currentState,
      nodeStates: updatedNodeStates,
    };
  };

  useEffect(() => {
    const client = new CamillaClient(address, port);
    clientRef.current = client;

    client.onMetrics = (metrics) => {
      updateState({
        metrics,
      });
    };

    client.onConfig = (config) => {
      updateState({
        config,
        connected: true,
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

  // Fonctions utilitaires avec mise à jour optimiste
  const setFilterParam = (filterName, paramName, value) => {
    const currentConfig = nodeState.value.config;
    if (!currentConfig) return;

    // Mise à jour optimiste
    const newConfig = { ...currentConfig };
    if (newConfig.filters?.[filterName]?.parameters) {
      newConfig.filters[filterName].parameters[paramName] = value;
      updateState({
        config: newConfig,
      });
    }

    // Envoi au serveur
    clientRef.current?.setFilterParam(filterName, paramName, value);
  };

  const setMixerGain = (mixerName, destIndex, sourceIndex, gain) => {
    const currentConfig = nodeState.value.config;
    if (!currentConfig) return;

    // Mise à jour optimiste
    const newConfig = { ...currentConfig };
    if (newConfig.mixers?.[mixerName]?.mapping) {
      newConfig.mixers[mixerName].mapping[destIndex].sources[sourceIndex].gain =
        gain;
      updateState({
        config: newConfig,
      });
    }

    // Envoi au serveur
    clientRef.current?.setMixerGain(mixerName, destIndex, sourceIndex, gain);
  };

  const setFilterBypass = (pipelineIndex, bypassed) => {
    const currentConfig = nodeState.value.config;
    if (!currentConfig) return;

    // Mise à jour optimiste
    const newConfig = { ...currentConfig };
    if (newConfig.pipeline?.[pipelineIndex]) {
      newConfig.pipeline[pipelineIndex].bypassed = bypassed;
      updateState({
        config: newConfig,
      });
    }

    // Envoi au serveur
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
