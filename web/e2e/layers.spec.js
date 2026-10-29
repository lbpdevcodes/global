import { expect, test } from "@playwright/test";

// Milliseconds from clicking a layer's button to the globe applying it,
// timed in the page so the test runner's own latency is left out.
async function timeLayer(page, label, id) {
  await page.goto("/");
  await expect(page.locator('[data-testid="globe"][data-layer="none"]')).toBeAttached();
  await page.evaluate((layerId) => {
    window.__layerApplied = new Promise((resolve) => {
      const globe = document.querySelector('[data-testid="globe"]');
      let start;
      document.addEventListener("click", () => { start = performance.now(); }, { capture: true, once: true });
      new MutationObserver(() => {
        if (globe.dataset.layer === layerId) resolve(performance.now() - start);
      }).observe(globe, { attributes: true, attributeFilter: ["data-layer"] });
    });
  }, id);

  await page.getByText(label, { exact: true }).click();
  const elapsed = await page.evaluate(() => window.__layerApplied);
  console.log(`${label} applied in ${elapsed.toFixed(0)} ms`);
  return elapsed;
}

test("a layer repaints the globe within 500 ms and explains itself in a legend", async ({ page }) => {
  expect(await timeLayer(page, "Democracy score", "democracyScore")).toBeLessThan(500);
  await expect(page.getByRole("list", { name: "Democracy score legend" })).toContainText("No data");
});

test("a layer can be read as a table instead of by color", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Population", { exact: true }).click();

  await page.getByRole("button", { name: "View as list" }).click();

  await expect(page.getByRole("table", { name: "Population by country" }).getByRole("row", { name: /France/ }))
    .toContainText("68,170,000");
});

for (const [label, id] of [["GDP per person", "gdpPerCapita"], ["Alliance or bloc", "alliances"], ["Upcoming elections", "nextElection"]]) {
  test(`the ${label} layer repaints the globe within 500 ms`, async ({ page }) => {
    expect(await timeLayer(page, label, id)).toBeLessThan(500);
  });
}

test("the new layers list France's GDP per person, NATO membership and next election", async ({ page }) => {
  await page.goto("/");
  const franceRow = (layer) => page.getByRole("table", { name: `${layer} by country` }).getByRole("row", { name: /France/ });
  const showList = async (layer) => {
    await page.getByText(layer, { exact: true }).click();
    await page.getByRole("button", { name: "View as list" }).click();
  };

  await showList("GDP per person");
  await expect(franceRow("GDP per person")).toContainText("US$46,150");

  await showList("Alliance or bloc");
  await expect(page.getByRole("combobox", { name: "Bloc" })).toHaveValue("NATO");
  await expect(franceRow("Alliance or bloc")).toContainText("Member of NATO");

  await showList("Upcoming elections");
  await expect(franceRow("Upcoming elections")).toContainText("Presidential, 2027");
});
