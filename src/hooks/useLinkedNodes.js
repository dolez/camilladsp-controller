import { useCallback } from "react";
import { camillaManager } from "../services/camilla/CamillaClient";

export function useLinkedNodes() {
  const linkNodes = useCallback((nodes, path, value) => {
    camillaManager.setConfigValueForNodes(nodes, path, value);
  }, []);

  const unlinkNodes = useCallback((nodes) => {
    // Réinitialise les valeurs liées
    camillaManager.setConfigValueForNodes(nodes, "linked", false);
  }, []);

  return {
    linkNodes,
    unlinkNodes,
  };
}
