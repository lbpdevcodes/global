import { describe, expect, it } from "vitest";
import { shareMeta } from "./share.js";

const SITE = "https://globe.example";
const cards = {
  FRA: { name: "France", parent: null },
  DNK: { name: "Denmark", parent: null },
  GRL: { name: "Greenland", parent: "DNK" },
};

describe("shareMeta", () => {
  it("titles a country page with the country's name", () => {
    expect(shareMeta("FRA", cards, SITE)).toContainEqual({ title: "France · Geopolitical Globe" });
  });

  it("describes what the country's profile holds, for search results and preview cards", () => {
    const description = "Leaders, government, economy and armed conflicts for France, each fact with its source and date.";

    expect(shareMeta("FRA", cards, SITE)).toEqual(expect.arrayContaining([
      { name: "description", content: description },
      { property: "og:title", content: "France · Geopolitical Globe" },
      { property: "og:description", content: description },
    ]));
  });

  it("names the page's own address in full, as preview cards and search engines require", () => {
    expect(shareMeta("FRA", cards, SITE)).toEqual(expect.arrayContaining([
      { tagName: "link", rel: "canonical", href: "https://globe.example/country/FRA" },
      { property: "og:url", content: "https://globe.example/country/FRA" },
    ]));
  });

  it("shows the globe as a large preview image", () => {
    expect(shareMeta("FRA", cards, SITE)).toEqual(expect.arrayContaining([
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Geopolitical Globe" },
      { property: "og:image", content: "https://globe.example/og.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ]));
  });

  it("names a territory with its parent and points search engines at the parent's page", () => {
    expect(shareMeta("GRL", cards, SITE)).toEqual(expect.arrayContaining([
      { title: "Greenland (Denmark) · Geopolitical Globe" },
      { tagName: "link", rel: "canonical", href: "https://globe.example/country/DNK" },
      { property: "og:url", content: "https://globe.example/country/DNK" },
    ]));
  });

  it("reads a lowercase code as the country it names, keeping the address uppercase", () => {
    expect(shareMeta("fra", cards, SITE)).toEqual(expect.arrayContaining([
      { title: "France · Geopolitical Globe" },
      { tagName: "link", rel: "canonical", href: "https://globe.example/country/FRA" },
    ]));
  });

  it.each([["the home page", undefined], ["a code that names nothing", "ZZZ"]])("gives %s the site's own card", (_, code) => {
    expect(shareMeta(code, cards, SITE)).toEqual(expect.arrayContaining([
      { title: "Geopolitical Globe" },
      { name: "description", content: "Spin the globe and open any country's sourced, dated geopolitical profile." },
      { tagName: "link", rel: "canonical", href: "https://globe.example/" },
      { property: "og:image", content: "https://globe.example/og.png" },
    ]));
  });
});
