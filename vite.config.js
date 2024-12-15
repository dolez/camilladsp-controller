import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Ajout des optimisations
    terserOptions: {
      compress: {
        passes: 2,
      },
    },
    chunkSizeWarningLimit: 50, // en kB
  },
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true, // Important pour WebSocket
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    //drop: ["console", "debugger"],
  },
});
