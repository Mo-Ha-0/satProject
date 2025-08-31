import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: ".",
    rollupOptions: {
      input: "index.html",
    },
  },
  server: {
    open: true,
  },
});
