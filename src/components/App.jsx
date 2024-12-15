// src/components/App.jsx
import { useState, useEffect } from "preact/hooks";
import { io } from "socket.io-client";

const socket = io();

export function App() {
  console.log("App component mounted");
  const [services, setServices] = useState([]);

  useEffect(() => {
    console.log("État initial de la connexion:", socket.connected);

    socket.on("avahi-services", (newServices) => {
      setServices(newServices);
    });
    socket.on("disconnect", () => {
      console.log("Client déconnecté");
    });
    socket.on("connect", () => {
      console.log("Client connecté");
    });

    return () => socket.off("avahi-services");
  }, []);

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">CamillaDSP Services</h1>
      {process.env.NODE_ENV === "development" && (
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Mode développement - Services simulés
        </div>
      )}
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service.name} class="p-4 bg-white shadow rounded">
            <h2 class="font-bold">{service.name}</h2>
            <p>Host: {service.host}</p>
            <p>Address: {service.address}</p>
            <p>Port: {service.port}</p>
            {service.txt && (
              <div class="mt-2 text-sm text-gray-600">
                <p>Version: {service.txt.version}</p>
                <p>Config: {service.txt.config}</p>
                <p>Status: {service.txt.status}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
