import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { prerenderPaths, readEntities, shareCards } from "./snapshot.js";

describe("readEntities", () => {
  it("finds no entities where no snapshot has been published or fetched", () => {
    expect(readEntities(join(tmpdir(), "no-snapshot-here"))).toEqual([]);
  });

  it("reads the entities from the snapshot's index", () => {
    const dir = mkdtempSync(join(tmpdir(), "snapshot-"));
    writeFileSync(join(dir, "index.json"), JSON.stringify({ snapshotId: "s", entities: [{ code: "FRA" }] }));

    expect(readEntities(dir)).toEqual([{ code: "FRA" }]);
  });
});

describe("shareCards", () => {
  it("keeps what a preview card names: each entity's name and its parent's code", () => {
    const entities = [
      { code: "DNK", name: "Denmark", parent: null, aliases: ["Kingdom of Denmark"], layers: {} },
      { code: "GRL", name: "Greenland", parent: "DNK", aliases: [], layers: null },
    ];

    expect(shareCards(entities)).toEqual({
      DNK: { name: "Denmark", parent: null },
      GRL: { name: "Greenland", parent: "DNK" },
    });
  });
});

describe("prerenderPaths", () => {
  it("prerenders the home page and a page for every entity, territories included", () => {
    expect(prerenderPaths([{ code: "DNK" }, { code: "GRL" }])).toEqual(["/", "/country/DNK", "/country/GRL"]);
  });
});
