import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
  build: {
    outDir: "dist/extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/popup.html"),
        "service-worker": resolve(__dirname, "background/service-worker.ts"),
        content: resolve(__dirname, "content-scripts/content.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "service-worker") {
            return "background/[name].js";
          }
          if (chunkInfo.name === "content") {
            return "content-scripts/[name].js";
          }
          return "[name]/[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "content.css") {
            return "content-scripts/[name][extname]";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
