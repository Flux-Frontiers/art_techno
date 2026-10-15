import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import pkg from "./package.json";

export default defineConfig({
  base: "./",
  plugins: [react()],
  // The version on the start screen, from package.json (the release bumps it).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { chunkSizeWarningLimit: 1500 },
});
