import { expect, test } from "@playwright/test";

test("a layer repaints the globe within 500 ms and explains itself in a legend", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-testid="globe"][data-layer="none"]')).toBeAttached();
  await page.evaluate(() => {
    window.__layerApplied = new Promise((resolve) => {
      const globe = document.querySelector('[data-testid="globe"]');
      let start;
      document.addEventListener("click", () => { start = performance.now(); }, { capture: true, once: true });
      new MutationObserver(() => {
        if (globe.dataset.layer === "democracyScore") resolve(performance.now() - start);
      }).observe(globe, { attributes: true, attributeFilter: ["data-layer"] });
    });
  });

  await page.getByText("Democracy score", { exact: true }).click();
  const elapsed = await page.evaluate(() => window.__layerApplied);

  console.log(`layer applied in ${elapsed.toFixed(0)} ms`);
  expect(elapsed).toBeLessThan(500);
  await expect(page.getByRole("list", { name: "Democracy score legend" })).toContainText("No data");
});

test("a layer can be read as a table instead of by color", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Population", { exact: true }).click();

  await page.getByRole("button", { name: "View as list" }).click();

  await expect(page.getByRole("table", { name: "Population by country" }).getByRole("row", { name: /France/ }))
    .toContainText("68,170,000");
});
