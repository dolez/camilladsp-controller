import { createContext } from "preact";
import { camillaState } from "../camilla/CamillaClient";

export const DiscoveryContext = createContext(null);

export function DiscoveryProvider({ children }) {
  const value = {
    nodes: camillaState.value.nodes,
  };

  return (
    <DiscoveryContext.Provider value={value}>
      {children}
    </DiscoveryContext.Provider>
  );
}
