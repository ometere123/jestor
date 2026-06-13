"use client";

import { getTierLabel, getTierColor } from "@/lib/jestora/balanceRules";
import { motion } from "framer-motion";

interface JestBalanceCardProps {
  balance: number;
  alias: string;
}

export default function JestBalanceCard({ balance, alias }: JestBalanceCardProps) {
  const tier = getTierLabel(balance);
  const tierColor = getTierColor(balance);

  return (
    <div className="relative border-4 border-[#121212] bg-[#FFF8E7] p-4 pt-6 shadow-[6px_6px_0px_#121212]">
      {/* halftone dots decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#121212 1px, transparent 1px)", backgroundSize: "8px 8px" }} />

      <div className="absolute top-1 right-1 bg-[#FFE600] border-2 border-[#121212] px-2 py-0.5 rotate-2 text-xs font-black uppercase">
        TOY BALANCE
      </div>

      <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-1">{alias}</p>

      <motion.div
        key={balance}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <p className="font-['Rubik_Mono_One',monospace] text-5xl text-[#121212] leading-none">
          {balance.toLocaleString()}
        </p>
      </motion.div>

      <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mt-1">Jest Points</p>

      <div className="mt-3 inline-block">
        <span className={`text-sm font-black uppercase ${tierColor}`}>{tier}</span>
      </div>

      <p className="mt-3 text-[10px] text-[#6B6257] border-t border-dashed border-[#C99A6B] pt-2">
        Not tokens. Not tradable. Not withdrawable. Only vibes.
      </p>
    </div>
  );
}
