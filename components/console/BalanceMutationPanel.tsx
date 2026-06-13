"use client";

import { CAPS } from "@/lib/jestora/balanceRules";

interface BalanceMutationPanelProps {
  rawDelta?: number;
  actualDelta?: number;
  balanceBefore?: number;
  balanceAfter?: number;
}

export default function BalanceMutationPanel({
  rawDelta,
  actualDelta,
  balanceBefore,
  balanceAfter,
}: BalanceMutationPanelProps) {
  if (actualDelta === undefined) return null;

  const wasCapped = rawDelta !== undefined && rawDelta !== actualDelta;

  return (
    <div className="bg-[#121212] border-2 border-[#35E36D] p-3 font-mono text-xs space-y-1">
      <p className="text-[#35E36D] font-black uppercase tracking-widest mb-2">[BALANCE MUTATION]</p>
      {rawDelta !== undefined && (
        <p className="text-[#D8D0BF]">
          <span className="text-[#FFE600]">requested_delta:</span> {rawDelta > 0 ? "+" : ""}{rawDelta}
        </p>
      )}
      {wasCapped && (
        <p className="text-[#FF3B30]">
          <span className="text-[#FF3B30]">capped_to:</span> {actualDelta}
          <span className="text-[#6B6257] ml-2">(contract rule)</span>
        </p>
      )}
      <p className="text-[#35E36D]">
        <span className="text-[#35E36D]">actual_delta:</span> {actualDelta > 0 ? "+" : ""}{actualDelta}
      </p>
      {balanceBefore !== undefined && (
        <p className="text-[#D8D0BF]">
          <span className="text-[#00D8C8]">balance:</span> {balanceBefore} → {balanceAfter}
        </p>
      )}
      <div className="border-t border-[#333] pt-1 mt-1 text-[#6B6257]">
        <p>daily_gain_cap: {CAPS.DAILY_GAIN_CAP} | caption_max: {CAPS.CAPTION_MAX} | chaos_max: {CAPS.CHAOS_MAX}</p>
      </div>
    </div>
  );
}
