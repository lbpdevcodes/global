import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile/ },
  ],
  // Build against the contract's example snapshot and serve it through
  // Cloudflare's local Pages runtime, so _redirects and the SPA fallback
  // behave as they do when deployed.
  webServer: {
    command: `SNAPSHOT_DIR=../contracts/examples npm run build && npx wrangler pages dev build/client --port ${port} --compatibility-date=2026-10-23`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
