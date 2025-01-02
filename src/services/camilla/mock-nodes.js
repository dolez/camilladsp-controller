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

  // Ajout d'une gestion d'erreur plus détaillée
  camillaServer.start().catch((error) => {
    console.error(`Erreur lors du démarrage du serveur ${name}:`, error);
  });

  // Ajout d'une promesse pour le démarrage du serveur HTTP
  return new Promise((resolve, reject) => {
    httpServer.listen(port, () => {
      console.log(`Mock CamillaDSP ${name} démarré sur le port ${port}`);
      resolve({ httpServer, camillaServer });
    });

    httpServer.on("error", (error) => {
      reject(error);
    });
  });
}

// Modification pour gérer les promesses
async function startServers() {
  try {
    const servers = await Promise.all([
      createMockServer(5000, "CamillaDSP-Main"),
      createMockServer(5001, "CamillaDSP-Test"),
    ]);

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

    return servers;
  } catch (error) {
    console.error("Erreur lors du démarrage des serveurs:", error);
    process.exit(1);
  }
}

// Démarrage des serveurs
startServers();
