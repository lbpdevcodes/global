import { expect, test } from "@playwright/test";

// The tags a link preview reads come from the served HTML, before any script runs.
const metaContent = (html, property) =>
  html.match(new RegExp(`<meta property="${property}" content="([^"]*)"`))?.[1];

test("a country link is served with that country's preview card", async ({ request }) => {
  const response = await request.get("/country/FRA");

  expect(response.status()).toBe(200);
  expect(metaContent(await response.text(), "og:title")).toBe("France · Geopolitical Globe");
});
