import { CamillaRack } from "./Rack/CamillaRack";
import { io } from "socket.io-client";
import { DiscoveryProvider } from "../services/discovery/DiscoveryContext";

const socket = io("http://localhost:3000", {
  transports: ["websocket"],
});

export function App() {
  return (
    <DiscoveryProvider>
      <CamillaRack socket={socket} />
    </DiscoveryProvider>
  );
}
