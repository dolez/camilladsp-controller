const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const CamillaServerMock = require("./camilla-server.mock");

// Crée deux serveurs mock sur des ports différents
function createMockServer(port, name) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const camillaServer = new CamillaServerMock(io, {
    name,
    port,
    config: `${name.toLowerCase()}.yml`,
  });

  camillaServer.start().catch(console.error);

  httpServer.listen(port, () => {
    console.log(`Mock CamillaDSP ${name} démarré sur le port ${port}`);
  });

  return { httpServer, camillaServer };
}

// Crée deux instances de CamillaDSP mock
const servers = [
  createMockServer(5000, "CamillaDSP-Main"),
  createMockServer(5001, "CamillaDSP-Test"),
];

// Gestion propre de l'arrêt
function cleanup() {
  console.log("\nArrêt des serveurs mock...");
  servers.forEach(({ httpServer, camillaServer }) => {
    camillaServer.stop();
    httpServer.close();
  });
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
