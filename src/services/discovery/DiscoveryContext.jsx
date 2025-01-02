import { createContext } from "preact";
import { discoveryState } from "./DiscoveryClient";
import { camillaState } from "../camilla/CamillaContext";

export const DiscoveryContext = createContext({
  discoveryState,
  camillaState,
});

export function DiscoveryProvider({ children }) {
  return (
    <DiscoveryContext.Provider value={{ discoveryState, camillaState }}>
      {children}
    </DiscoveryContext.Provider>
  );
}
