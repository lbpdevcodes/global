import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { finishBuild } from "./finish-build.js";

const SITE = "https://globe.example";
const entities = [
  { code: "DNK", kind: "sovereign" },
  { code: "GRL", kind: "territory" },
];

// A client build as React Router leaves it: one folder per prerendered page.
function buildOutput() {
  const dir = mkdtempSync(join(tmpdir(), "build-"));
  writeFileSync(join(dir, "index.html"), "home");
  writeFileSync(join(dir, "__spa-fallback.html"), "shell");
  for (const { code } of entities) {
    mkdirSync(join(dir, "country", code), { recursive: true });
    writeFileSync(join(dir, "country", code, "index.html"), `page ${code}`);
  }
  return dir;
}

describe("finishBuild", () => {
  let dir;
  beforeEach(() => {
    dir = buildOutput();
    finishBuild(dir, { entities, siteUrl: SITE });
  });

  it("serves each country page without a trailing slash, as country/CODE.html", () => {
    expect(readFileSync(join(dir, "country/DNK.html"), "utf8")).toBe("page DNK");
    expect(existsSync(join(dir, "country/DNK"))).toBe(false);
  });

  it("answers an address with no page by the app's shell, which explains the code it does not know", () => {
    expect(readFileSync(join(dir, "404.html"), "utf8")).toBe("shell");
  });

  it("lists the home page and every profiled country in the sitemap, leaving territories to their parents", () => {
    const sitemap = readFileSync(join(dir, "sitemap.xml"), "utf8");

    expect([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, url]) => url))
      .toEqual(["https://globe.example/", "https://globe.example/country/DNK"]);
  });

  it("points crawlers at the sitemap", () => {
    expect(readFileSync(join(dir, "robots.txt"), "utf8")).toContain("Sitemap: https://globe.example/sitemap.xml");
  });
});
