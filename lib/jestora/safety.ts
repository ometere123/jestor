// Client-side pre-flight safety checks before hitting the contract.
// These are NOT replacements for contract-level safety, they just give faster UX feedback.

const HARD_BLOCKED_PATTERNS = [
  /\b(kill|murder|rape|suicide|bomb|terrorist)\b/i,
  /\b(n[i1]gg[e3]r|f[a@]gg[o0]t|ch[i1]nk|sp[i1]c)\b/i,
  /\b(buy token|investment|returns|yield|apy|earn \d+%|financial advice)\b/i,
];

export function clientSafetyCheck(text: string): { safe: boolean; reason: string } {
  for (const pattern of HARD_BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: "Submission contains blocked content. The safety goblin said no.",
      };
    }
  }
  if (text.trim().length < 5) {
    return { safe: false, reason: "Too short to judge." };
  }
  if (text.trim().length > 500) {
    return { safe: false, reason: "Too long. Keep it under 500 characters." };
  }
  return { safe: true, reason: "" };
}

export const UNSAFE_SAFETY_CLASSES = new Set([
  "UNSAFE",
  "TARGETED_ABUSE",
  "HATE",
  "SEXUAL",
  "SELF_HARM",
]);

export function isSafe(safetyClass: string): boolean {
  return !UNSAFE_SAFETY_CLASSES.has(safetyClass);
}
