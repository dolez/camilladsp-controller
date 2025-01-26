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
    chunkSizeWarningLimit: 50,
  },
  server: {
    cors: true,
    proxy: {
      "/api": {
        target: "http://192.168.4.1",
        changeOrigin: true,
      },
      "/events": {
        target: "http://192.168.4.1",
        ws: true,
      },
    },
  },
  esbuild: {
    //drop: ["console", "debugger"],
  },
});
