// Fails when Lighthouse scores a page below 90 for performance or
// accessibility (PRD M4), taking the median of three runs as Lighthouse CI
// does, since software-rendered WebGL makes single runs noisy. Uses Lighthouse's desktop preset, matching the
// PRD's performance target ("a mid-range laptop"); WebGL runs in software
// (SwiftShader) here, so real hardware does better.
//   node scripts/lighthouse.js <url> [<url>...]
import { chromium } from "@playwright/test";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktop from "lighthouse/core/config/desktop-config.js";

const MINIMUM = 90;
const RUNS = 3;
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const urls = process.argv.slice(2);
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH ?? chromium.executablePath(),
  chromeFlags: ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let failed = false;

for (const url of urls) {
  const reports = [];
  for (let run = 0; run < RUNS; run += 1) {
    const { lhr } = await lighthouse(url, { port: chrome.port, onlyCategories: ["performance", "accessibility"] }, desktop);
    reports.push(lhr);
  }
  const score = (id) => median(reports.map((lhr) => Math.round(lhr.categories[id].score * 100)));
  const runs = reports.map((lhr) => Math.round(lhr.categories.performance.score * 100)).join(", ");
  console.log(`${url}  performance ${score("performance")} (runs: ${runs})  accessibility ${score("accessibility")}`);
  if (score("performance") < MINIMUM || score("accessibility") < MINIMUM) failed = true;
}

await chrome.kill();
if (failed) {
  console.error(`A page scored below ${MINIMUM}.`);
  process.exit(1);
}
