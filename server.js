const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Choisir l'implémentation selon l'environnement
const AvahiMonitor =
  process.env.NODE_ENV === "production"
    ? require("./src/services/discovery/DiscoveryService")
    : require("./src/services/discovery/DiscoveryService.mock");

const filesRouter = require("./src/server/routes/files");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware pour parser le JSON
app.use(express.json());

// Middleware statique pour les fichiers de production
app.use(express.static("dist"));

// Routes API pour la gestion des fichiers
app.use("/api", filesRouter);

// Monitor Avahi
const avahiMonitor = new AvahiMonitor(io);
avahiMonitor
  .start()
  .then(() => {
    console.log("Monitoring démarré avec succès");
  })
  .catch((err) => {
    console.error("Erreur lors du démarrage du monitoring:", err);
  });

// Gestion des connexions Socket.io
io.on("connection", (socket) => {
  console.log("Client connecté");

  // Envoyer l'état actuel au nouveau client
  const services = Array.from(avahiMonitor.services.values());
  socket.emit("avahi-services", services);

  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
