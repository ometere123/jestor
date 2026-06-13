import { z } from "zod";

export const SafetyClassSchema = z.enum([
  "SAFE",
  "UNSAFE",
  "TARGETED_ABUSE",
  "HATE",
  "SEXUAL",
  "SELF_HARM",
  "SPAM",
  "TOO_MEAN",
]);

export const CaptionVerdictSchema = z.object({
  safety_class: SafetyClassSchema,
  prompt_fit: z.number().int().min(0).max(100),
  humor_score: z.number().int().min(0).max(100),
  originality_score: z.number().int().min(0).max(100),
  meme_style: z.enum(["ABSURDIST", "DRY", "CHAOTIC", "WHOLESOME", "SATIRE", "META", "LOW_EFFORT"]),
  outcome: z.enum(["TRY_AGAIN", "SMALL_LAUGH", "CLEAN_HIT", "ABSURD_GENIUS", "TOO_DERIVATIVE", "BLOCKED"]),
  balance_delta: z.number().int().min(0).max(80),
  actual_delta: z.number().int().optional(),
  raw_delta_requested: z.number().int().optional(),
  reason: z.string(),
});

export const RoastVerdictSchema = z.object({
  safety_class: SafetyClassSchema,
  playfulness_score: z.number().int().min(0).max(100),
  humor_score: z.number().int().min(0).max(100),
  outcome: z.enum(["HUMBLE_PIE", "BRUTAL_BUT_SAFE", "TRY_AGAIN", "BLOCKED"]),
  balance_delta: z.number().int().min(0).max(40),
  actual_delta: z.number().int().optional(),
  reason: z.string(),
});

export const DuelVerdictSchema = z.object({
  winner: z.enum(["A", "B", "DRAW", "NO_CONTEST"]),
  entry_a_score: z.number().int().min(0).max(100),
  entry_b_score: z.number().int().min(0).max(100),
  reason: z.string(),
  a_delta: z.number().int().min(0).max(60),
  b_delta: z.number().int().min(0).max(60),
  safety_class: z.enum(["SAFE", "UNSAFE"]),
});

export const ChaosVerdictSchema = z.object({
  valid: z.boolean(),
  chaos_class: z.enum(["BLESSING", "CURSE", "MIRROR", "CONFETTI", "NULL_EVENT"]),
  balance_delta: z.number().int().min(-25).max(75),
  actual_delta: z.number().int().optional(),
  title: z.string(),
  flavor_text: z.string(),
  reason: z.string(),
});

export type CaptionVerdict = z.infer<typeof CaptionVerdictSchema>;
export type RoastVerdict = z.infer<typeof RoastVerdictSchema>;
export type DuelVerdict = z.infer<typeof DuelVerdictSchema>;
export type ChaosVerdict = z.infer<typeof ChaosVerdictSchema>;
