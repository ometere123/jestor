import { test, expect, type Page } from "@playwright/test";

const live = process.env.JESTOR_E2E_LIVE === "true";

async function injectedAccount(page: Page): Promise<{ address: string; chainId: string }> {
  return page.evaluate(async () => {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!ethereum) throw new Error("A real injected EIP-1193 wallet is required for live browser evidence.");
    const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
    const chainId = await ethereum.request({ method: "eth_chainId" }) as string;
    if (!accounts?.[0]) throw new Error("The injected wallet returned no account.");
    if (chainId.toLowerCase() !== "0xf22f") throw new Error(`Live browser is on ${chainId}; Studionet chain 61999 (0xf22f) is required.`);
    return { address: accounts[0].toLowerCase(), chainId };
  });
}

async function connectWallet(page: Page): Promise<string> {
  await page.goto("/");
  await page.waitForLoadState("domcontentloaded");
  await page.getByRole("button", { name: "Connect Wallet" }).click();
  return (await injectedAccount(page)).address;
}

async function ensureProfile(page: Page, alias: string): Promise<void> {
  await page.goto("/arena");
  await page.waitForLoadState("domcontentloaded");
  const create = page.getByPlaceholder(/Your alias/i);
  if (await create.isVisible().catch(() => false)) {
    await create.fill(alias);
    await page.getByRole("button", { name: "Create Profile" }).click();
    await expect(page.getByText(/profile created|waiting for consensus|Jest Points/i)).toBeVisible({ timeout: 180_000 });
  }
}

test.describe("live Studionet sealed duel and verdict challenge", () => {
  test.skip(!live, "Set JESTOR_E2E_LIVE=true with a real injected wallet browser to run live evidence.");

  test("two-wallet commit, join, reload recovery, reveal, resolution, and challenge", async ({ browser }) => {
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();
    const pageC = await browser.newPage();
    await pageA.goto("/");
    await pageA.waitForLoadState("domcontentloaded");
    const hasInjectedProvider = await pageA.evaluate(() => Boolean((window as Window & { ethereum?: unknown }).ethereum));
    test.skip(!hasInjectedProvider, "No injected EIP-1193 wallet is available in this browser; live transaction evidence must run in a wallet-enabled browser.");
    const accountA = await connectWallet(pageA);
    const accountB = await connectWallet(pageB);
    const accountC = await connectWallet(pageC);
    if (new Set([accountA, accountB, accountC]).size !== 3) {
      throw new Error("Live browser test requires three independently selected injected wallet accounts (A, B, and a non-participant challenger C).");
    }
    await ensureProfile(pageA, `e2e-a-${Date.now()}`);
    await ensureProfile(pageB, `e2e-b-${Date.now()}`);
    await ensureProfile(pageC, `e2e-c-${Date.now()}`);

    await pageA.goto("/duels");
    const promptOptions = pageA.locator("select option");
    await expect(promptOptions.first()).toBeVisible({ timeout: 60_000 });
    await pageA.getByPlaceholder(/Your duel entry/i).fill(`sealed entry A ${Date.now()}`);
    await pageA.getByRole("button", { name: "Start Duel" }).click();
    const cardA = pageA.locator('[data-testid^="duel-card-"]').first();
    await expect(cardA).toHaveAttribute("data-duel-status", "waiting", { timeout: 180_000 });
    const duelId = await cardA.getAttribute("data-duel-id");
    if (!duelId) throw new Error("No chain-derived duel id was rendered after the finalized commit.");
    await expect(cardA.getByText(/Join deadline:/i)).toBeVisible();
    await expect(cardA.getByRole("button", { name: /Reveal saved entry/i })).toHaveCount(0);

    await pageB.goto("/duels");
    const openCardB = pageB.locator(`[data-testid="duel-card-${duelId}"]`);
    await expect(openCardB).toBeVisible({ timeout: 60_000 });
    pageB.once("dialog", (dialog) => void dialog.accept(`sealed entry B ${Date.now()}`));
    await openCardB.getByRole("button", { name: "Join Duel" }).click();
    await expect(openCardB).toHaveAttribute("data-duel-status", "reveal", { timeout: 180_000 });

    await pageA.reload();
    const recoveryCardA = pageA.locator(`[data-testid="duel-card-${duelId}"]`);
    await expect(recoveryCardA.getByText(/Reveal deadline:/i)).toBeVisible({ timeout: 60_000 });
    await expect(recoveryCardA.getByRole("button", { name: /Reveal saved entry/i })).toBeVisible();
    await recoveryCardA.getByRole("button", { name: /Reveal saved entry/i }).click();
    await expect(recoveryCardA.getByText(/Reveal saved entry/i)).toHaveCount(0, { timeout: 180_000 });

    await pageB.reload();
    const recoveryCardB = pageB.locator(`[data-testid="duel-card-${duelId}"]`);
    await expect(recoveryCardB.getByRole("button", { name: /Reveal saved entry/i })).toBeVisible({ timeout: 60_000 });
    await recoveryCardB.getByRole("button", { name: /Reveal saved entry/i }).click();
    await expect(recoveryCardB).toHaveAttribute("data-duel-status", "ready", { timeout: 180_000 });
    await recoveryCardB.getByRole("button", { name: /Resolve Duel via GenLayer/i }).click();
    await expect(recoveryCardB).toHaveAttribute("data-duel-status", "resolved", { timeout: 240_000 });

    await pageC.goto(`/verdict/${duelId}`);
    await expect(pageC.getByRole("heading", { name: /Verdict/ })).toBeVisible({ timeout: 60_000 });
    await expect(pageC.getByRole("heading", { name: "Verdict challenge" })).toBeVisible();
    await pageC.getByLabel("Reason for independent reassessment").fill("The independent reviewers should reassess the substantive safety and winner decision.");
    await pageC.getByRole("button", { name: "Challenge verdict" }).click();
    await expect(pageC.getByText("Challenge receipt verified")).toBeVisible({ timeout: 300_000 });
    await expect(pageC.getByText(/Finalized · MAJORITY_AGREE · SUCCESS/i)).toBeVisible();
    await expect(pageC.getByText(/Challenge settled/i)).toBeVisible();
  });
});
