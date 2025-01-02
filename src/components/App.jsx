import { CamillaRack } from "./Rack/CamillaRack";
import { DiscoveryProvider } from "../services/discovery/DiscoveryContext";

export function App() {
  return (
    <DiscoveryProvider>
      <CamillaRack />
    </DiscoveryProvider>
  );
}
