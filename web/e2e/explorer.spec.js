import { expect, test } from "@playwright/test";

const panelHeading = (page, name) => page.getByRole("heading", { level: 2, name });

test("the globe renders with a hint to pick a country", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Click a country or search")).toBeVisible();
});

test("a deep link opens that country's sourced profile", async ({ page }) => {
  const response = await page.goto("/country/FRA");

  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/country\/FRA$/);
  await expect(panelHeading(page, "France")).toBeVisible();
  await page.getByRole("button", { name: "Source for Population" }).click();
  await expect(page.getByRole("note", { name: "Population source" })).toContainText("data.worldbank.org");
});

test("a partially recognized state shows its status banner", async ({ page }) => {
  await page.goto("/country/XKX");

  await expect(panelHeading(page, "Kosovo")).toBeVisible();
  await expect(page.getByRole("status", { name: "Recognition status" })).toBeVisible();
});

test("a territory link opens its parent's profile and keeps the territory in the URL", async ({ page }) => {
  await page.goto("/country/GRL");

  await expect(panelHeading(page, "Denmark")).toBeVisible();
  await expect(page.getByRole("status", { name: "Territory" })).toContainText("Greenland: Autonomous region of Denmark");
  await expect(page).toHaveURL(/\/country\/GRL$/);
});

test("an unknown code says so", async ({ page }) => {
  await page.goto("/country/ZZZ");

  await expect(page.getByText("No country or territory has the code ZZZ.")).toBeVisible();
});

test("search by an alternate name opens the country and updates the URL", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Search countries" }).fill("Holland");

  await page.getByRole("option", { name: "Netherlands (Holland)" }).click();

  await expect(page).toHaveURL(/\/country\/NLD$/);
  await expect(panelHeading(page, "Netherlands")).toBeVisible();
});

test("the panel opens within 300 ms of choosing a country", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Search countries" }).fill("Den");
  const option = page.getByRole("option", { name: "Denmark" });
  await option.waitFor();
  await page.evaluate(() => {
    window.__panelOpened = new Promise((resolve) => {
      const start = performance.now();
      const observer = new MutationObserver(() => {
        const loaded = !document.querySelector('[aria-label^="Loading"]')
          && [...document.querySelectorAll("h3")].some((heading) => heading.textContent === "Sources");
        if (document.querySelector("h2")?.textContent === "Denmark" && loaded) {
          observer.disconnect();
          resolve(performance.now() - start);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
  });

  await option.click();
  const elapsed = await page.evaluate(() => window.__panelOpened);

  console.log(`panel opened in ${elapsed.toFixed(0)} ms`);
  expect(elapsed).toBeLessThan(300);
});

test("Escape closes the panel and returns to the bare globe", async ({ page }) => {
  await page.goto("/country/FRA");
  await expect(panelHeading(page, "France")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/\/$/);
  await expect(panelHeading(page, "France")).toBeHidden();
});
