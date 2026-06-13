"use client";

import { outcomeEmoji } from "@/lib/jestora/format";
import Badge from "@/components/ui/Badge";
import type { AnyVerdict } from "@/lib/genlayer/types";

interface LatestVerdictCardProps {
  verdict: AnyVerdict | null;
}

export default function LatestVerdictCard({ verdict }: LatestVerdictCardProps) {
  if (!verdict) {
    return (
      <div className="border-2 border-dashed border-[#C99A6B] p-4 text-center">
        <p className="text-sm text-[#6B6257] font-mono">No verdict yet. Submit something.</p>
      </div>
    );
  }

  const outcome = ("outcome" in verdict ? verdict.outcome : null) ??
    ("winner" in verdict ? verdict.winner : null) ??
    ("chaos_class" in verdict ? verdict.chaos_class : "UNKNOWN");

  const safetyClass = "safety_class" in verdict ? verdict.safety_class : "SAFE";
  const delta = ("actual_delta" in verdict ? verdict.actual_delta : null) ??
    ("balance_delta" in verdict ? verdict.balance_delta : 0);
  const reason = "reason" in verdict ? verdict.reason : "";

  return (
    <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-[#6B6257]">Latest Verdict</span>
        <Badge variant={safetyClass === "SAFE" ? "safe" : "unsafe"}>{safetyClass}</Badge>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{outcomeEmoji(outcome ?? "")}</span>
        <span className="font-['Rubik_Mono_One',monospace] text-lg text-[#121212]">{outcome}</span>
      </div>

      {typeof delta === "number" && delta !== 0 && (
        <div className={`text-xl font-black mb-2 ${delta > 0 ? "text-[#35E36D]" : "text-[#FF3B30]"}`}>
          {delta > 0 ? "+" : ""}{delta} Jest Points
        </div>
      )}

      {reason && (
        <p className="text-xs text-[#6B6257] font-mono border-t border-dashed border-[#C99A6B] pt-2 mt-2">
          {reason}
        </p>
      )}
    </div>
  );
}
