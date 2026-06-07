import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Config Vite — React + Tailwind v4 + alias @ vers /src (requis par shadcn/ui)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["local.buvard.app", "dev.buvard.app"],
    host: true,
    port: 5173,
    // HMR via Cloudflare tunnel : websocket en wss sur port 443.
    hmr: {
      host: "dev.buvard.app",
      protocol: "wss",
      clientPort: 443,
    },
  },
});
