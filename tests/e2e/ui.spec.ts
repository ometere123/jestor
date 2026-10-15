import { test, expect } from "@playwright/test";

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
