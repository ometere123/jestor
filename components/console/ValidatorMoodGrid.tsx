"use client";

import { motion } from "framer-motion";

const VALIDATORS = [
  { id: "V-01", mood: "Skeptical", icon: "🧐" },
  { id: "V-02", mood: "Amused", icon: "😄" },
  { id: "V-03", mood: "Arguing", icon: "🗣️" },
  { id: "V-04", mood: "Confused", icon: "🤔" },
  { id: "V-05", mood: "Consensus", icon: "✅" },
];

type ValidatorState = "idle" | "running" | "consensus";

interface ValidatorMoodGridProps {
  state: ValidatorState;
}

const MOODS_BY_STATE: Record<ValidatorState, string[]> = {
  idle: ["Idle", "Idle", "Idle", "Idle", "Idle"],
  running: ["Reading...", "Judging...", "Arguing...", "Reconsidering...", "Checking..."],
  consensus: ["Agreed", "Agreed", "Agreed", "Agreed", "✅ Done"],
};

export default function ValidatorMoodGrid({ state }: ValidatorMoodGridProps) {
  const moods = MOODS_BY_STATE[state];

  return (
    <div className="bg-[#121212] border-2 border-[#0057FF] p-3">
      <p className="text-[#0057FF] font-mono text-xs font-black uppercase tracking-widest mb-2">
        [VALIDATORS] Humour Equivalence Check
      </p>
      <div className="grid grid-cols-5 gap-2">
        {VALIDATORS.map((v, i) => (
          <motion.div
            key={v.id}
            className="border border-[#333] p-2 text-center"
            animate={state === "running" ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ repeat: state === "running" ? Infinity : 0, duration: 0.8, delay: i * 0.15 }}
          >
            <div className="text-lg">{v.icon}</div>
            <p className="text-[10px] font-mono text-[#6B6257]">{v.id}</p>
            <p className="text-[10px] font-bold text-[#00D8C8]">{moods[i]}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
