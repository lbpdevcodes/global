// Build settings from the environment, shared by vite.config.js and
// react-router.config.js.

// The published snapshot's data/v1 directory: web/data/v1 by default (written
// by `bin/rails data:publish` or fetched by `npm run fetch:snapshot`), or the
// contract examples for end-to-end tests.
export const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR ?? "data/v1";

// Where the site is served, for the absolute addresses preview cards and
// sitemaps need.
export const SITE_URL = process.env.SITE_URL ?? "https://geopolitical-globe.pages.dev";
