import { useEffect, useRef, useState } from "preact/hooks";
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

  // Crée une version debounced de setConfig avec un délai de 200ms (5Hz)
  const debouncedSetConfig = useRef(
    debounce((config) => {
      clientRef.current?.setConfig(config);
    }, 200)
  ).current;

  // Charge la liste des fichiers de convolution
  const loadConvolutionFiles = async () => {
    try {
      const response = await fetch(`/api/files/${nodeId}`);
      if (response.ok) {
        const files = await response.json();
        updateState({
          convolutionFiles: files,
        });
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des fichiers de convolution:",
        error
      );
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
    const currentConfig = nodeState.value.config;
    if (!currentConfig) return;

    // Mise à jour optimiste immédiate
    const newConfig = { ...currentConfig };
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
    const currentConfig = nodeState.value.config;
    if (!currentConfig) return;

    const newConfig = { ...currentConfig };
    const newPipeline = [];

    // Pour chaque filtre dans le pipeline
    currentConfig.pipeline.forEach((step) => {
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
    setConfig,
    loadConvolutionFiles,
    duplicateFiltersForStereo,
  };
}
