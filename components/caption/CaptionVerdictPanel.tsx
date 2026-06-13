"use client";

import { motion } from "framer-motion";
import ScorePill from "@/components/ui/ScorePill";
import Badge from "@/components/ui/Badge";
import Sticker from "@/components/ui/Sticker";
import { outcomeEmoji, memeStyleLabel } from "@/lib/jestora/format";
import type { CaptionVerdict } from "@/lib/genlayer/types";

interface CaptionVerdictPanelProps {
  verdict: CaptionVerdict;
}

const OUTCOME_COLORS: Record<string, string> = {
  ABSURD_GENIUS: "#35E36D",
  CLEAN_HIT: "#0057FF",
  SMALL_LAUGH: "#FFE600",
  TRY_AGAIN: "#C99A6B",
  TOO_DERIVATIVE: "#D8D0BF",
  BLOCKED: "#FF3B30",
};

export default function CaptionVerdictPanel({ verdict }: CaptionVerdictPanelProps) {
  const isSafe = verdict.safety_class === "SAFE";
  const delta = verdict.actual_delta ?? verdict.balance_delta;
  const rawDelta = verdict.raw_delta_requested;
  const wasCapped = rawDelta !== undefined && rawDelta !== delta;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Outcome stamp */}
      <div className="flex items-center gap-3 border-4 border-[#121212] p-3 bg-white shadow-[4px_4px_0px_#121212]">
        <span className="text-4xl">{outcomeEmoji(verdict.outcome)}</span>
        <div>
          <p className="font-['Rubik_Mono_One',monospace] text-lg text-[#121212]">{verdict.outcome.replace(/_/g, " ")}</p>
          <p className="text-xs text-[#6B6257] font-mono">{memeStyleLabel(verdict.meme_style)}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={isSafe ? "safe" : "unsafe"}>{verdict.safety_class}</Badge>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-3">
        <ScorePill label="Prompt Fit" value={verdict.prompt_fit} />
        <ScorePill label="Humour" value={verdict.humor_score} />
        <ScorePill label="Originality" value={verdict.originality_score} />
      </div>

      {/* Balance delta */}
      {delta !== 0 && isSafe && (
        <div className="flex items-center gap-3">
          <Sticker
            color={OUTCOME_COLORS[verdict.outcome] ?? "#FFE600"}
            rotate={-1}
          >
            {delta > 0 ? "+" : ""}{delta} Jest Points
          </Sticker>
          {wasCapped && (
            <span className="text-xs font-mono text-[#6B6257]">
              (requested {rawDelta}, capped to {delta})
            </span>
          )}
        </div>
      )}

      {/* Reason */}
      <div className="border-l-4 border-[#0057FF] pl-3 py-1">
        <p className="text-xs font-black uppercase tracking-widest text-[#0057FF] mb-1">Validator Reason</p>
        <p className="text-sm text-[#121212] font-mono">{verdict.reason}</p>
      </div>
    </motion.div>
  );
}
