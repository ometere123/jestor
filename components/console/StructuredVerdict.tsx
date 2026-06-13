"use client";

import { motion } from "framer-motion";

interface StructuredVerdictProps {
  verdict: Record<string, unknown>;
  title?: string;
}

export default function StructuredVerdict({ verdict, title = "Structured Verdict" }: StructuredVerdictProps) {
  if (!verdict) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#121212] border-2 border-[#00D8C8] p-4"
    >
      <div className="flex items-center gap-2 mb-3 border-b border-[#00D8C8] pb-2">
        <span className="text-[#00D8C8] font-mono text-xs font-black uppercase tracking-widest">{title}</span>
        <span className="text-[#6B6257] font-mono text-xs ml-auto">JSON</span>
      </div>
      <pre className="text-[#D8D0BF] font-mono text-xs overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(verdict, null, 2)}
      </pre>
    </motion.div>
  );
}
