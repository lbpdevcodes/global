import { cpSync, existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { readEntities, shareCards } from "./snapshot.js";

const URL_PREFIX = "/data/v1/";
const SHARE_MODULE = "virtual:share-cards";

// Serves a published snapshot at /data/v1 in development and copies it into
// the client build. It also provides `virtual:share-cards`: the site's address
// and each country's preview card (app/lib/share.js), so the prerendered pages
// and client navigation build the same tags.
export function snapshotPlugin({ dir, siteUrl }) {
  const root = resolve(dir);
  return {
    name: "globe-snapshot",
    resolveId(id) {
      if (id === SHARE_MODULE) return `\0${SHARE_MODULE}`;
    },
    load(id) {
      if (id !== `\0${SHARE_MODULE}`) return;
      return `export const siteUrl = ${JSON.stringify(siteUrl)};\n` +
        `export const cards = ${JSON.stringify(shareCards(readEntities(root)))};\n`;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split("?")[0];
        if (!path?.startsWith(URL_PREFIX)) return next();
        const file = normalize(join(root, path.slice(URL_PREFIX.length)));
        if (!file.startsWith(root) || !existsSync(file) || extname(file) !== ".json") return next();
        response.setHeader("Content-Type", "application/json");
        response.end(readFileSync(file));
      });
    },
    writeBundle(options) {
      if (this.environment?.name !== "client") return;
      if (!existsSync(root)) throw new Error(`No snapshot at ${root}. Run bin/rails data:publish or set SNAPSHOT_DIR.`);
      cpSync(root, join(options.dir, "data/v1"), { recursive: true });
    },
  };
}
