"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Sticker from "@/components/ui/Sticker";
import { chaosClassLabel } from "@/lib/jestora/format";
import type { ChaosVerdict } from "@/lib/genlayer/types";

const CHAOS_BG: Record<string, string> = {
  BLESSING: "#35E36D",
  CURSE: "#FF3B30",
  MIRROR: "#00D8C8",
  CONFETTI: "#FF8BD1",
  NULL_EVENT: "#D8D0BF",
};

interface ChaosVerdictPanelProps {
  verdict: ChaosVerdict;
}

export default function ChaosVerdictPanel({ verdict }: ChaosVerdictPanelProps) {
  const delta = verdict.actual_delta ?? verdict.balance_delta;
  const bg = CHAOS_BG[verdict.chaos_class] ?? "#FFE600";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="border-4 border-[#121212] p-4 shadow-[6px_6px_0px_#121212]"
      style={{ backgroundColor: bg }}
    >
      <div className="flex items-center justify-between mb-3">
        <Sticker color="#121212" className="text-white">
          {chaosClassLabel(verdict.chaos_class)}
        </Sticker>
        <Badge variant={verdict.valid ? "safe" : "unsafe"}>
          {verdict.valid ? "VALID" : "BLOCKED"}
        </Badge>
      </div>

      <p className="font-['Rubik_Mono_One',monospace] text-xl text-[#121212] mb-2">{verdict.title}</p>
      <p className="text-sm font-bold text-[#121212] mb-3">{verdict.flavor_text}</p>

      {delta !== 0 && verdict.valid && (
        <div className="bg-white border-2 border-[#121212] inline-block px-3 py-1 mb-3">
          <span className="font-black text-lg text-[#121212]">
            {delta > 0 ? "+" : ""}{delta} Jest Points
          </span>
        </div>
      )}

      <div className="bg-white bg-opacity-60 border border-[#121212] p-2">
        <p className="text-xs font-mono text-[#121212]">{verdict.reason}</p>
      </div>
    </motion.div>
  );
}
