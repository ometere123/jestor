"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import ScorePill from "@/components/ui/ScorePill";
import { outcomeEmoji } from "@/lib/jestora/format";
import type { DuelVerdict } from "@/lib/genlayer/types";

interface DuelResolutionPanelProps {
  verdict: DuelVerdict;
  aliasA: string;
  aliasB: string;
}

export default function DuelResolutionPanel({ verdict, aliasA, aliasB }: DuelResolutionPanelProps) {
  const winnerLabel = verdict.winner === "A" ? aliasA : verdict.winner === "B" ? aliasB : verdict.winner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-4 border-[#7A35FF] bg-white p-4 shadow-[4px_4px_0px_#121212] space-y-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-4xl">{outcomeEmoji(verdict.winner)}</span>
        <div>
          <p className="text-xs font-black uppercase text-[#6B6257] tracking-widest">Winner</p>
          <p className="font-['Rubik_Mono_One',monospace] text-xl text-[#121212]">{winnerLabel}</p>
        </div>
        <Badge variant={verdict.safety_class === "SAFE" ? "safe" : "unsafe"} className="ml-auto">
          {verdict.safety_class}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-black uppercase text-[#6B6257]">{aliasA}</p>
          <ScorePill label="Score" value={verdict.entry_a_score} />
          <p className={`text-sm font-black ${verdict.actual_a_delta && verdict.actual_a_delta > 0 ? "text-[#35E36D]" : "text-[#6B6257]"}`}>
            +{verdict.actual_a_delta ?? verdict.a_delta} pts
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-black uppercase text-[#6B6257]">{aliasB}</p>
          <ScorePill label="Score" value={verdict.entry_b_score} />
          <p className={`text-sm font-black ${verdict.actual_b_delta && verdict.actual_b_delta > 0 ? "text-[#35E36D]" : "text-[#6B6257]"}`}>
            +{verdict.actual_b_delta ?? verdict.b_delta} pts
          </p>
        </div>
      </div>

      <div className="border-l-4 border-[#7A35FF] pl-3">
        <p className="text-xs font-black uppercase text-[#7A35FF] tracking-widest mb-1">Validator Reason</p>
        <p className="text-sm font-mono text-[#121212]">{verdict.reason}</p>
      </div>
    </motion.div>
  );
}
