import { expect, test } from "@playwright/test";

test("home page renders the globe canvas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
});

test("a country deep link loads the app instead of a 404", async ({ page }) => {
  const response = await page.goto("/country/FRA");
  expect(response.status()).toBe(200);
  await expect(page).toHaveURL(/\/country\/FRA$/);
  await expect(page.locator("canvas")).toBeVisible();
});
