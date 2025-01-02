import { useEffect } from "preact/hooks";
import {
  DiscoveryClient,
  discoveryState,
} from "../services/discovery/DiscoveryClient";

export function useDiscovery() {
  useEffect(() => {
    const discoveryClient = new DiscoveryClient();

    discoveryClient.connect();

    // Nettoyage à la destruction du composant
    return () => {
      discoveryClient.disconnect();
    };
  }, []);

  return discoveryState.value;
}
