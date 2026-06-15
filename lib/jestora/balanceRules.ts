// Deterministic balance cap rules, mirrors the contract caps exactly.
// These are used for frontend display and validation only.
// The contract enforces the actual caps on-chain.

export const CAPS = {
  CAPTION_MAX: 80,
  ROAST_MAX: 40,
  DUEL_WIN_MAX: 60,
  DUEL_LOSE_MAX: 10,
  CHAOS_MAX: 75,
  CHAOS_MIN: -25,
  DAILY_GAIN_CAP: 180,
  DAILY_LOSS_CAP: -50,
} as const;

export function clampDelta(raw: number, max: number, min = 0): number {
  return Math.max(min, Math.min(max, raw));
}

export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function getTierLabel(balance: number): string {
  if (balance >= 1000) return "Meme Lord";
  if (balance >= 500) return "Zine Wizard";
  if (balance >= 200) return "Caption Gremlin";
  if (balance >= 100) return "Laugh Track";
  if (balance >= 50) return "Rookie Jester";
  return "Fresh Paper";
}

export function getTierColor(balance: number): string {
  if (balance >= 1000) return "text-[#FF3B30]";
  if (balance >= 500) return "text-[#7A35FF]";
  if (balance >= 200) return "text-[#0057FF]";
  if (balance >= 100) return "text-[#35E36D]";
  if (balance >= 50) return "text-[#FFE600]";
  return "text-[#C99A6B]";
}
