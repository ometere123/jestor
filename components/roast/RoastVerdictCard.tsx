"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import ScorePill from "@/components/ui/ScorePill";
import { outcomeEmoji } from "@/lib/jestora/format";
import type { RoastVerdict } from "@/lib/genlayer/types";

interface RoastVerdictCardProps {
  verdict: RoastVerdict;
}

export default function RoastVerdictCard({ verdict }: RoastVerdictCardProps) {
  const delta = verdict.actual_delta ?? verdict.balance_delta;
  const isSafe = verdict.safety_class === "SAFE";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="border-4 border-[#FF3B30] bg-white p-4 shadow-[4px_4px_0px_#121212] space-y-3"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{outcomeEmoji(verdict.outcome)}</span>
        <div>
          <p className="font-['Rubik_Mono_One',monospace] text-base text-[#121212]">
            {verdict.outcome.replace(/_/g, " ")}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={isSafe ? "safe" : "unsafe"}>{verdict.safety_class}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ScorePill label="Playfulness" value={verdict.playfulness_score} />
        <ScorePill label="Humour" value={verdict.humor_score} />
      </div>

      {delta !== 0 && isSafe && (
        <p className={`font-black text-xl ${delta > 0 ? "text-[#35E36D]" : "text-[#FF3B30]"}`}>
          {delta > 0 ? "+" : ""}{delta} Jest Points
        </p>
      )}

      <div className="border-l-4 border-[#FF3B30] pl-3">
        <p className="text-xs font-mono text-[#121212]">{verdict.reason}</p>
      </div>
    </motion.div>
  );
}
