import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { snapshotPlugin } from "./vite/snapshot-plugin.js";

const stub = (name) => fileURLToPath(new URL(`./vite/stubs/${name}.js`, import.meta.url));

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), snapshotPlugin({ dir: process.env.SNAPSHOT_DIR ?? "data/v1" })],
  resolve: {
    // Libraries globe.gl imports only for layers this app never draws
    // (hexagons, heatmaps). Dropping them cuts the globe chunk substantially.
    alias: [
      { find: /^h3-js$/, replacement: stub("h3-js") },
      { find: /^three\/webgpu$/, replacement: stub("three-webgpu") },
      { find: /^three\/tsl$/, replacement: stub("three-tsl") },
    ],
  },
  // The reader imports field labels from ../contracts/v1/fields.json.
  server: { fs: { allow: [".."] } },
});
