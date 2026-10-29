import { expect, test } from "@playwright/test";

// The tags a link preview reads come from the served HTML, before any script runs.
const metaContent = (html, property) =>
  html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1];

test("a country link is served with that country's preview card", async ({ request }) => {
  const response = await request.get("/country/FRA");

  expect(response.status()).toBe(200);
  expect(metaContent(await response.text(), "og:title")).toBe("France · Geopolitical Globe");
});

test("an unknown code answers 404 while the app still explains it", async ({ page }) => {
  const response = await page.goto("/country/ZZZ");

  expect(response.status()).toBe(404);
  await expect(page.getByText("No country or territory has the code ZZZ.")).toBeVisible();
});

test("the tab title follows the country chosen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Search countries" }).fill("Holland");

  await page.getByRole("option", { name: "Netherlands (Holland)" }).click();

  await expect(page).toHaveTitle("Netherlands · Geopolitical Globe");
});
