import CamillaRack from "./Rack/CamillaRack";
import { io } from "socket.io-client";

const socket = io();

export function App() {
  return <CamillaRack socket={socket} />;
}
