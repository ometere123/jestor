import { formatDistanceToNow } from "date-fns";

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function timeAgo(ts: number): string {
  return formatDistanceToNow(new Date(ts * 1000), { addSuffix: true });
}

export function outcomeEmoji(outcome: string): string {
  const map: Record<string, string> = {
    ABSURD_GENIUS: "🔥",
    CLEAN_HIT: "✅",
    SMALL_LAUGH: "😄",
    TRY_AGAIN: "😐",
    TOO_DERIVATIVE: "🔁",
    BLOCKED: "🚫",
    HUMBLE_PIE: "🥧",
    BRUTAL_BUT_SAFE: "💀",
    DRAW: "🤝",
    NO_CONTEST: "❌",
    BLESSING: "✨",
    CURSE: "😈",
    MIRROR: "🪞",
    CONFETTI: "🎉",
    NULL_EVENT: "🌀",
  };
  return map[outcome] ?? "❓";
}

export function chaosClassLabel(cls: string): string {
  const map: Record<string, string> = {
    BLESSING: "CHAOS BLESSING",
    CURSE: "CHAOS CURSE",
    MIRROR: "MIRROR EVENT",
    CONFETTI: "CONFETTI STORM",
    NULL_EVENT: "NULL EVENT",
  };
  return map[cls] ?? cls;
}

export function memeStyleLabel(style: string): string {
  const map: Record<string, string> = {
    ABSURDIST: "ABSURDIST",
    DRY: "DRY HUMOUR",
    CHAOTIC: "CHAOTIC",
    WHOLESOME: "WHOLESOME",
    SATIRE: "SATIRE",
    META: "META",
    LOW_EFFORT: "LOW EFFORT",
  };
  return map[style] ?? style;
}
