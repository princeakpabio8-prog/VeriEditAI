import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { resolve } from "path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/extension"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup/popup.html"),
        "service-worker": resolve(__dirname, "background/service-worker.ts"),
        "content-script": resolve(__dirname, "content/content-script.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "service-worker") {
            return "background/[name].js";
          }
          if (chunkInfo.name === "content-script") {
            return "content/[name].js";
          }
          if (chunkInfo.name === "popup") {
            return "popup/[name].js";
          }
          return "[name].js";
        },
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "popup.css") {
            return "popup/[name][extname]";
          }
          return "assets/[name][extname]";
        },
      },
    },
  },
});
