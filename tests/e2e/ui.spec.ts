import { test, expect } from "@playwright/test";
import { ARENA_NAV_ITEMS } from "../../components/layout/arenaNavigation";

test("preserves Jestor branding and fails closed without a browser wallet", async ({ page }) => {
  await page.goto("/duels");
  await expect(page.getByRole("link", { name: "JESTOR" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meme Duels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
  await expect(page.getByText(/burner|private key/i)).toHaveCount(0);
});

test("renders a permanent verdict shell without treating missing chain data as evidence", async ({ page }) => {
  await page.goto("/verdict/e2e-nonexistent-result");
  await expect(page.getByText("Permanent result page")).toBeVisible();
  await expect(page.getByText(/verified finalized transaction/i)).toHaveCount(0);
});

test("keeps desktop sidebar and top navigation aligned", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto("/arena");

  const expectedHrefs = ARENA_NAV_ITEMS.map((item) => item.href);
  const hrefs = async (selector: string) => page.locator(selector).evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  await expect(page.locator('nav[aria-label="Primary navigation"]')).toBeVisible();
  await expect(page.locator('nav[aria-label="Arena navigation"]')).toBeVisible();
  await expect(page.locator('nav[aria-label="Primary navigation"] a')).toHaveCount(expectedHrefs.length);
  await expect(page.locator('nav[aria-label="Arena navigation"] a')).toHaveCount(expectedHrefs.length);
  expect(await hrefs('nav[aria-label="Primary navigation"] a')).toEqual(expectedHrefs);
  expect(await hrefs('nav[aria-label="Arena navigation"] a')).toEqual(expectedHrefs);
  await expect(page.locator('nav[aria-label="Primary navigation"] a[href="/arena"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('nav[aria-label="Arena navigation"] a[href="/arena"]')).toHaveAttribute("aria-current", "page");

  const primaryBox = await page.locator('nav[aria-label="Primary navigation"]').boundingBox();
  const walletBox = await page.locator("header").getByRole("button", { name: "Connect Wallet" }).boundingBox();
  expect(primaryBox).not.toBeNull();
  expect(walletBox).not.toBeNull();
  expect(primaryBox!.x + primaryBox!.width).toBeLessThanOrEqual(walletBox!.x);

  await page.setViewportSize({ width: 1440, height: 360 });
  await page.reload();
  const sidebar = page.locator("aside");
  expect(await sidebar.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  const footer = page.getByText(/Jest Points are toy balances/i);
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
});

test("exposes the same ten destinations through the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/arena");
  await page.getByRole("button", { name: "Open menu" }).click();

  const mobileNavigation = page.locator('nav[aria-label="Mobile navigation"]');
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.locator("a")).toHaveCount(ARENA_NAV_ITEMS.length);
  await expect(mobileNavigation.locator('a[href="/arena"]')).toHaveAttribute("aria-current", "page");
  expect(await mobileNavigation.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(
    ARENA_NAV_ITEMS.map((item) => item.href),
  );
});

test("serves every primary navigation route", async ({ page }) => {
  for (const item of ARENA_NAV_ITEMS) {
    const response = await page.request.get(item.href);
    expect(response.ok(), `${item.href} should return a successful response`).toBe(true);
  }
});
