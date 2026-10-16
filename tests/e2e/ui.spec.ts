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

test("keeps the ten-item desktop navigation compact and free of horizontal overflow", async ({ page }) => {
  const expectedHrefs = ARENA_NAV_ITEMS.map((item) => item.href);
  const hrefs = async (selector: string) => page.locator(selector).evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  for (const width of [1280, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/arena");

    const primaryNavigation = page.locator('nav[aria-label="Primary navigation"]');
    const sidebarNavigation = page.locator('nav[aria-label="Arena navigation"]');
    await expect(primaryNavigation).toBeVisible();
    await expect(sidebarNavigation).toBeVisible();
    await expect(primaryNavigation.locator("a")).toHaveCount(expectedHrefs.length);
    await expect(sidebarNavigation.locator("a")).toHaveCount(expectedHrefs.length);
    expect(await hrefs('nav[aria-label="Primary navigation"] a')).toEqual(expectedHrefs);
    expect(await hrefs('nav[aria-label="Arena navigation"] a')).toEqual(expectedHrefs);
    await expect(primaryNavigation.locator('a[href="/arena"]')).toHaveAttribute("aria-current", "page");
    await expect(sidebarNavigation.locator('a[href="/arena"]')).toHaveAttribute("aria-current", "page");

    const layout = await page.locator("header").evaluate((header) => {
      const nav = header.querySelector('nav[aria-label="Primary navigation"]') as HTMLElement | null;
      const wallet = [...header.querySelectorAll("button")].find((button) => button.textContent?.includes("Connect Wallet")) as HTMLElement | undefined;
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        navOverflowX: nav ? getComputedStyle(nav).overflowX : "missing",
        navScrollWidth: nav?.scrollWidth ?? 0,
        navClientWidth: nav?.clientWidth ?? 0,
        navRight: nav?.getBoundingClientRect().right ?? 0,
        walletLeft: wallet?.getBoundingClientRect().left ?? 0,
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.navOverflowX).not.toMatch(/auto|scroll/);
    expect(layout.navScrollWidth).toBeLessThanOrEqual(layout.navClientWidth);
    expect(layout.navRight).toBeLessThanOrEqual(layout.walletLeft);
  }

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
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.documentWidth).toBeLessThanOrEqual(overflow.viewportWidth);
});

test("serves every primary navigation route", async ({ page }) => {
  for (const item of ARENA_NAV_ITEMS) {
    const response = await page.request.get(item.href);
    expect(response.ok(), `${item.href} should return a successful response`).toBe(true);
  }
});
