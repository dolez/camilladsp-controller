import CamillaController from "./CamillaController";
import { io } from "socket.io-client";

const socket = io();

export function App() {
  return <CamillaController socket={socket} />;
}
