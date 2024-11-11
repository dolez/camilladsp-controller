// master/backend/src/app.js

const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const discovery = require("./services/discovery");
const SocketHandler = require("./services/socket");
const logger = require("./utils/logger");

const app = express();
const httpServer = createServer(app);

// Configuration de base
app.use(cors());
app.use(express.json());

// En production, sert l'application React
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "static")));
}

// Configuration Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "development" ? "http://localhost:3000" : false,
  },
});

// Initialisation du gestionnaire de sockets
const socketHandler = new SocketHandler(io);

// Routes API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    nodesCount: discovery.getNodes().length,
    uptime: process.uptime(),
  });
});

app.get("/api/nodes", (req, res) => {
  res.json(discovery.getNodes());
});

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  socketHandler.handleConnection(socket);
});

// Démarrage des services
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Démarrage du service de découverte
    discovery.start();

    // Démarrage du serveur HTTP
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Gestion de l'arrêt gracieux
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down...");
      httpServer.close(() => {
        discovery.stop();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
