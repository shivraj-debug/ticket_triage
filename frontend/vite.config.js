import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/tickets": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://backend:4000",
        changeOrigin: true,
      },
    },
  },
});