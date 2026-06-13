"use client";

import { motion, AnimatePresence } from "framer-motion";
import { timeAgo, outcomeEmoji } from "@/lib/jestora/format";
import type { ChaosEvent } from "@/lib/genlayer/types";

interface ChaosFeedProps {
  events: ChaosEvent[];
}

export default function ChaosFeed({ events }: ChaosFeedProps) {
  if (!events.length) {
    return (
      <div className="border-2 border-dashed border-[#C99A6B] p-4 text-center">
        <p className="text-sm text-[#6B6257] font-mono">Chaos feed is empty. Make something happen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {events.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 border-l-4 border-[#FF8BD1] pl-3 py-1"
          >
            <span className="text-lg shrink-0">
              {outcomeEmoji(ev.outcome ?? ev.chaos_class ?? ev.winner ?? "")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-[#121212]">
                  {ev.alias ?? ev.alias_a ?? "???"}
                </span>
                {ev.type === "duel" && (
                  <span className="text-xs text-[#6B6257]">vs {ev.alias_b}</span>
                )}
                <span className="text-xs font-mono text-[#6B6257]">
                  {ev.type === "duel" ? `duel → ${ev.winner}` : ev.type}
                </span>
                {typeof ev.delta === "number" && ev.delta !== 0 && (
                  <span className={`text-xs font-black ${ev.delta > 0 ? "text-[#35E36D]" : "text-[#FF3B30]"}`}>
                    {ev.delta > 0 ? "+" : ""}{ev.delta}
                  </span>
                )}
              </div>
              {ev.flavor_text && (
                <p className="text-xs text-[#6B6257] italic mt-0.5 truncate">{ev.flavor_text}</p>
              )}
              <p className="text-[10px] text-[#C99A6B] mt-0.5">{timeAgo(ev.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
