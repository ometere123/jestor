"use client";

import { motion } from "framer-motion";
import type { ConsoleTrace } from "@/lib/genlayer/types";

interface ConsensusTraceProps {
  traces: ConsoleTrace[];
}

const STEP_COLORS: Record<string, string> = {
  SUBMIT_CAPTION: "#FFE600",
  SUBMIT_ROAST: "#FF8BD1",
  INVOKE_CHAOS: "#FF8BD1",
  SAFETY: "#35E36D",
  GENLAYER: "#0057FF",
  VALIDATORS: "#00D8C8",
  CONSENSUS: "#7A35FF",
  CAP: "#FF3B30",
  BALANCE: "#35E36D",
  EVENT: "#FFE600",
  ERROR: "#FF3B30",
};

export default function ConsensusTrace({ traces }: ConsensusTraceProps) {
  if (!traces.length) {
    return (
      <div className="bg-[#121212] border border-[#00D8C8] p-4 font-mono text-[#00D8C8] text-xs">
        <p className="opacity-50">// No trace yet. Submit something to generate a consensus trace.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border-2 border-[#00D8C8] p-4 font-mono text-xs space-y-1 max-h-80 overflow-y-auto">
      {traces.map((trace, i) => {
        const color = STEP_COLORS[trace.step] ?? "#D8D0BF";
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex gap-3"
          >
            <span style={{ color }} className="shrink-0 font-black">[{trace.step}]</span>
            <span className="text-[#D8D0BF]">{trace.message}</span>
          </motion.div>
        );
      })}
      <div className="animate-pulse text-[#00D8C8] opacity-70">█</div>
    </div>
  );
}
