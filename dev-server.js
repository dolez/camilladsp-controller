const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const AvahiMonitorMock = require("./src/services/discovery/DiscoveryService.mock");
const CamillaServerMock = require("./src/services/camilla/camilla-server.mock");
require("./src/services/camilla/mock-nodes");

const app = express();
const httpServer = createServer(app);

// Configuration CORS pour supporter Vite et Storybook
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["websocket"],
  allowUpgrades: false,
});

// Middleware Express pour CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialise les mocks
const avahiMonitor = new AvahiMonitorMock(io);
const camillaServer = new CamillaServerMock(io);

// Démarre les services mock
avahiMonitor.start().catch(console.error);
camillaServer.start().catch(console.error);

let isShuttingDown = false;

// Gestion propre de l'arrêt
async function cleanup(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\nReceived ${signal}. Cleaning up...`);

  // Arrête les services
  avahiMonitor.stop();
  camillaServer.stop();

  // Ferme les connexions
  await new Promise((resolve) => io.close(resolve));
  await new Promise((resolve) => httpServer.close(resolve));

  // Ne pas appeler process.exit() ici, laisse le processus se terminer naturellement
  console.log("Cleanup complete");
}

// Capture les signaux d'arrêt
process.on("SIGINT", () => cleanup("SIGINT"));
process.on("SIGTERM", () => cleanup("SIGTERM"));

// En cas d'erreur non gérée
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  cleanup("uncaughtException").finally(() => process.exit(1));
});

// Démarre le serveur
const PORT = process.env.PORT || 3000;

// Gestion des erreurs de démarrage
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please try another port.`);
    process.exit(1);
  } else {
    console.error("Server error:", error);
    process.exit(1);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});
