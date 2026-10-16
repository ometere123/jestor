import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARENA_NAV_ITEMS, isArenaNavItemActive } from "../../components/layout/arenaNavigation";

describe("Arena navigation contract", () => {
  it("keeps one typed ten-destination menu definition", () => {
    expect(ARENA_NAV_ITEMS).toHaveLength(10);
    expect(new Set(ARENA_NAV_ITEMS.map((item) => item.href)).size).toBe(10);
    expect(ARENA_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Dashboard",
      "Caption",
      "Roast",
      "Duels",
      "Chaos",
      "Remix",
      "Circuit",
      "Career",
      "Scores",
      "Rules",
    ]);
  });

  it("points every destination at an existing App Router page", () => {
    for (const item of ARENA_NAV_ITEMS) {
      const pagePath = path.join(process.cwd(), "app", item.href.slice(1), "page.tsx");
      expect(existsSync(pagePath), `${item.href} should have an App Router page`).toBe(true);
    }
  });

  it("recognizes exact and nested active routes without false positives", () => {
    expect(isArenaNavItemActive("/career", "/career")).toBe(true);
    expect(isArenaNavItemActive("/verdict/result-1", "/career")).toBe(false);
    expect(isArenaNavItemActive("/leaderboard/detail", "/leaderboard")).toBe(true);
    expect(isArenaNavItemActive(null, "/arena")).toBe(false);
  });
});
