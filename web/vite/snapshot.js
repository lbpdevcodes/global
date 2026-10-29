import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The snapshot's entities, or none where no snapshot has been published or
// fetched, so development, tests and lint work without one.
export function readEntities(dir) {
  const file = join(dir, "index.json");
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, "utf8")).entities;
}

// What each country's preview card names, keyed by code (app/lib/share.js).
export function shareCards(entities) {
  return Object.fromEntries(entities.map(({ code, name, parent }) => [code, { name, parent }]));
}

// Every page served as its own HTML file, so a shared link carries its card.
export function prerenderPaths(entities) {
  return ["/", ...entities.map(({ code }) => `/country/${code}`)];
}
