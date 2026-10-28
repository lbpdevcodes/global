import { expect, test } from "@playwright/test";

test("on a phone the profile is a bottom sheet that expands to full height", async ({ page }) => {
  await page.goto("/country/FRA");
  await expect(page.getByRole("heading", { level: 2, name: "France" })).toBeVisible();
  const viewport = page.viewportSize();
  const sheet = page.locator("aside");

  const peek = await sheet.boundingBox();
  expect(peek.y + peek.height).toBeCloseTo(viewport.height, 0);
  expect(peek.height / viewport.height).toBeCloseTo(0.6, 1);

  await page.getByRole("button", { name: "Expand panel" }).click();
  await expect.poll(async () => (await sheet.boundingBox()).height / viewport.height).toBeGreaterThan(0.85);
});
