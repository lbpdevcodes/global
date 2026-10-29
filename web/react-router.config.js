import { join } from "node:path";
import { finishBuild } from "./scripts/finish-build.js";
import { SITE_URL, SNAPSHOT_DIR } from "./vite/settings.js";
import { prerenderPaths, readEntities } from "./vite/snapshot.js";

// Static output only: no server at read time. Every country page is
// prerendered from the snapshot's index, so a shared link carries its own
// preview card (app/lib/share.js); finishBuild then shapes the output for
// Cloudflare Pages.
export default {
  ssr: false,
  prerender: () => prerenderPaths(readEntities(SNAPSHOT_DIR)),
  buildEnd: ({ reactRouterConfig }) =>
    finishBuild(join(reactRouterConfig.buildDirectory, "client"), { entities: readEntities(SNAPSHOT_DIR), siteUrl: SITE_URL }),
};
