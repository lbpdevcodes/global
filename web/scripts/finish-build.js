import { copyFileSync, readdirSync, renameSync, rmdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Shapes React Router's prerendered output for Cloudflare Pages
// (react-router.config.js runs it once the build ends).
export function finishBuild(dir, { entities, siteUrl }) {
  moveCountryPages(join(dir, "country"));
  // An unknown code, such as /country/ZZZ, gets the app's shell with a 404
  // status, and the app explains that no country has that code.
  copyFileSync(join(dir, "__spa-fallback.html"), join(dir, "404.html"));
  writeFileSync(join(dir, "sitemap.xml"), sitemap(entities, siteUrl));
  writeFileSync(join(dir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
}

// A territory's page shows its parent's profile and names the parent's page
// as canonical (app/lib/share.js), so only profiled countries are listed.
function sitemap(entities, siteUrl) {
  const profiled = entities.filter(({ kind }) => kind !== "territory");
  const urls = [`${siteUrl}/`, ...profiled.map(({ code }) => `${siteUrl}/country/${code}`)];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

// Pages serves country/FRA/index.html at /country/FRA/, but the site's links
// have no trailing slash; country/FRA.html is served at /country/FRA.
function moveCountryPages(countries) {
  for (const code of readdirSync(countries)) {
    renameSync(join(countries, code, "index.html"), join(countries, `${code}.html`));
    rmdirSync(join(countries, code));
  }
}
