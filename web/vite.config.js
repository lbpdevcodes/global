import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { snapshotPlugin } from "./vite/snapshot-plugin.js";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), snapshotPlugin({ dir: process.env.SNAPSHOT_DIR ?? "data/v1" })],
  // The reader imports field labels from ../contracts/v1/fields.json.
  server: { fs: { allow: [".."] } },
});
