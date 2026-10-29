import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Separate from vite.config.js: the React Router plugin builds the app and
// has no place in unit tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.js"],
    include: ["app/**/*.test.{js,jsx}", "scripts/**/*.test.js", "vite/**/*.test.js", "test/**/*.test.{js,jsx}"],
  },
});
