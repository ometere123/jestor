// GenLayer / Jestor type definitions

export interface PlayerProfile {
  alias: string;
  address: string;
  created_at: number;
  caption_count: number;
  roast_count: number;
  chaos_count: number;
  duel_wins: number;
  safety_flags: number;
  balance: number;
}

export type SafetyClass =
  | "SAFE"
  | "UNSAFE"
  | "TARGETED_ABUSE"
  | "HATE"
  | "SEXUAL"
  | "SELF_HARM"
  | "SPAM"
  | "TOO_MEAN";

export type MemeStyle =
  | "ABSURDIST"
  | "DRY"
  | "CHAOTIC"
  | "WHOLESOME"
  | "SATIRE"
  | "META"
  | "LOW_EFFORT";

export type CaptionOutcome =
  | "TRY_AGAIN"
  | "SMALL_LAUGH"
  | "CLEAN_HIT"
  | "ABSURD_GENIUS"
  | "TOO_DERIVATIVE"
  | "BLOCKED";

export type RoastOutcome = "HUMBLE_PIE" | "BRUTAL_BUT_SAFE" | "TRY_AGAIN" | "BLOCKED";

export type DuelWinner = "A" | "B" | "DRAW" | "NO_CONTEST";

export type ChaosClass = "BLESSING" | "CURSE" | "MIRROR" | "CONFETTI" | "NULL_EVENT";

export interface CaptionVerdict {
  safety_class: SafetyClass;
  prompt_fit: number;
  humor_score: number;
  originality_score: number;
  meme_style: MemeStyle;
  outcome: CaptionOutcome;
  balance_delta: number;
  actual_delta?: number;
  raw_delta_requested?: number;
  reason: string;
}

export interface RoastVerdict {
  safety_class: SafetyClass;
  playfulness_score: number;
  humor_score: number;
  outcome: RoastOutcome;
  balance_delta: number;
  actual_delta?: number;
  raw_delta_requested?: number;
  reason: string;
}

export interface DuelVerdict {
  winner: DuelWinner;
  entry_a_score: number;
  entry_b_score: number;
  reason: string;
  a_delta: number;
  b_delta: number;
  actual_a_delta?: number;
  actual_b_delta?: number;
  safety_class: SafetyClass;
}

export interface ChaosVerdict {
  valid: boolean;
  chaos_class: ChaosClass;
  balance_delta: number;
  actual_delta?: number;
  raw_delta_requested?: number;
  title: string;
  flavor_text: string;
  reason: string;
}

export type AnyVerdict = CaptionVerdict | RoastVerdict | DuelVerdict | ChaosVerdict;

export interface Submission {
  id: string;
  type: "caption" | "roast" | "chaos";
  round_id?: string;
  author: string;
  text: string;
  prompt?: string;
  status: "pending" | "judged" | "blocked";
  verdict: AnyVerdict | null;
  balance_delta: number;
  created_at: number;
}

export interface Duel {
  id: string;
  prompt_id: string;
  prompt_text: string;
  player_a: string;
  entry_a: string;
  player_b: string | null;
  entry_b: string | null;
  status: "waiting" | "ready" | "resolving" | "resolved";
  verdict: DuelVerdict | null;
  created_at: number;
}

export interface Prompt {
  id: string;
  text: string;
  author: string;
  active: boolean;
  created_at: number;
}

export interface ChaosEvent {
  type: "caption" | "roast" | "chaos" | "duel";
  author?: string;
  alias?: string;
  alias_a?: string;
  alias_b?: string;
  winner?: string;
  outcome?: string;
  chaos_class?: string;
  title?: string;
  flavor_text?: string;
  delta?: number;
  reason: string;
  timestamp: number;
}

export interface LeaderboardEntry {
  address: string;
  alias: string;
  balance: number;
  duel_wins: number;
}

export interface ProtocolStats {
  total_submissions: number;
  total_duels: number;
  total_chaos_actions: number;
  total_profiles: number;
}

export interface ConsoleTrace {
  step: string;
  message: string;
  ts: number;
}
