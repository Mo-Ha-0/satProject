import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html",
    },
    // Ensure assets are copied correctly
    copyPublicDir: true,
  },
  server: {
    open: true,
  },
  // Ensure public assets are accessible
  publicDir: "public",
});
