const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Choisir l'implémentation selon l'environnement
const AvahiMonitor =
  process.env.NODE_ENV === "production"
    ? require("./src/services/avahi-monitor")
    : require("./src/services/avahi-monitor.mock");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middleware statique pour les fichiers de production
app.use(express.static("dist"));

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
  socket.emit("avahi-services", Array.from(avahiMonitor.services.values()));

  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
