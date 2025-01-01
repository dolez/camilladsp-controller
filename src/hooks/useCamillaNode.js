import { useEffect, useCallback } from "react";
import {
  camillaManager,
  camillaState,
} from "../services/camilla/CamillaClient";

export function useCamillaNode(node) {
  const metrics = camillaState.value.nodeMetrics.get(node.address);
  const connection = camillaManager.connections.get(node.address);

  useEffect(() => {
    if (!connection) {
      camillaManager.initializeNode(node);
    }
    return () => {
      camillaManager.removeNode(node.address);
    };
  }, [node, connection]);

  const updateConfig = useCallback(
    (path, value) => {
      if (connection) {
        connection.setConfigValue(path, value);
      }
    },
    [connection]
  );

  const toggleProcessing = useCallback(() => {
    if (connection) {
      connection.setConfigValue("processing", !metrics?.isProcessing);
    }
  }, [connection, metrics?.isProcessing]);

  if (!connection || !metrics) {
    return {
      config: node.config,
      metrics: {
        cpuLoad: 0,
        captureRate: 0,
        captureLevel: -60,
        playbackRate: 0,
        playbackLevel: -60,
        signalPresent: false,
        isProcessing: false,
      },
      isConnected: false,
      isProcessing: false,
      updateConfig,
      toggleProcessing,
    };
  }

  return {
    config: node.config,
    metrics,
    isConnected: connection.connected,
    isProcessing: metrics.isProcessing,
    updateConfig,
    toggleProcessing,
  };
}
