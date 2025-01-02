import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "preact/hooks";
import { signal } from "@preact/signals";
import { CamillaClient } from "../services/camilla/CamillaClient";
import { camillaState, getNodeId } from "../services/camilla/CamillaContext";

// Fonction utilitaire de debounce avec trailing
function debounce(func, wait) {
  let timeout;
  let lastArgs;

  const execute = () => {
    func.apply(null, lastArgs);
    lastArgs = null;
  };

  return function executedFunction(...args) {
    lastArgs = args;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(execute, wait);
  };
}

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
    convolutionFiles: [],
  });

export function useCamillaNode(address, port) {
  const nodeId = `${address}:${port}`;

  // Référence au client pour pouvoir l'utiliser dans les callbacks
  const clientRef = useRef(null);

  // Crée un état local pour ce nœud s'il n'existe pas déjà
  if (!camillaState.value.nodeStates.has(nodeId)) {
    camillaState.value = {
      ...camillaState.value,
      nodeStates: new Map(camillaState.value.nodeStates).set(nodeId, {
        config: null,
        metrics: null,
        connected: false,
        convolutionFiles: [],
      }),
    };
  }

  // État local pour ce nœud
  const nodeState = useMemo(
    () => camillaState.value.nodeStates.get(nodeId),
    [camillaState.value.nodeStates, nodeId]
  );

  // Met à jour l'état local du nœud
  const updateState = (update) => {
    const currentState = camillaState.value;
    const nodeStates = new Map(currentState.nodeStates);
    const currentNodeState = nodeStates.get(nodeId);

    nodeStates.set(nodeId, {
      ...currentNodeState,
      ...update,
    });

    camillaState.value = {
      ...currentState,
      nodeStates,
    };
  };

  // Debounce la mise à jour de la config pour éviter les appels trop fréquents
  const debouncedSetConfig = useCallback(
    debounce((config) => {
      clientRef.current?.setConfig(config);
    }, 100),
    []
  );

  const loadConvolutionFiles = async () => {
    try {
      const response = await fetch(`/api/files/${nodeId}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      const files = await response.json();
      updateState({ convolutionFiles: files });
    } catch (error) {
      console.error("Error loading convolution files:", error);
      updateState({ convolutionFiles: [] });
    }
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

    client.onDisconnect = () => {
      updateState({
        connected: false,
        metrics: null,
      });
    };

    client.connect();
    loadConvolutionFiles();

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
    if (!nodeState?.config) return;

    // Mise à jour optimiste immédiate
    const newConfig = { ...nodeState.config };
    if (newConfig.filters?.[filterName]?.parameters) {
      newConfig.filters[filterName].parameters[paramName] = value;
      updateState({
        config: newConfig,
      });
    }

    // Envoi au serveur debounced
    debouncedSetConfig(newConfig);
  };

  const duplicateFiltersForStereo = () => {
    if (!nodeState?.config) return;

    const newConfig = { ...nodeState.config };
    const newPipeline = [];

    // Pour chaque filtre dans le pipeline
    nodeState.config.pipeline.forEach((step) => {
      if (step.type === "Filter") {
        // Ajoute le filtre pour le canal gauche (0)
        newPipeline.push({
          ...step,
          channel: 0,
        });
        // Ajoute le filtre pour le canal droit (1)
        newPipeline.push({
          ...step,
          channel: 1,
        });
      } else {
        // Conserve les autres étapes (comme le mixer) telles quelles
        newPipeline.push(step);
      }
    });

    newConfig.pipeline = newPipeline;
    setConfig(newConfig);
  };

  const setConfig = (config) => {
    // Mise à jour optimiste immédiate
    updateState({
      config,
    });

    // Envoi au serveur debounced
    debouncedSetConfig(config);
  };

  const setMixerGain = (mixerName, destIndex, sourceIndex, gain) => {
    if (!nodeState?.config) return;

    // Mise à jour optimiste
    const newConfig = { ...nodeState.config };
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
    if (!nodeState?.config) return;

    // Mise à jour optimiste
    const newConfig = { ...nodeState.config };
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
    state: nodeState,
    nodeId,
    setFilterParam,
    setMixerGain,
    setFilterBypass,
    setConfig,
    loadConvolutionFiles,
    duplicateFiltersForStereo,
  };
}
