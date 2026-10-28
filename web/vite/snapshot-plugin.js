import { cpSync, existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const URL_PREFIX = "/data/v1/";

// Serves a published snapshot at /data/v1 in development and copies it into
// the client build. SNAPSHOT_DIR points at the snapshot's data/v1 directory:
// web/data/v1 by default (written by `bin/rails data:publish`), or the
// contract examples for end-to-end tests.
export function snapshotPlugin({ dir }) {
  const root = resolve(dir);
  return {
    name: "globe-snapshot",
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
