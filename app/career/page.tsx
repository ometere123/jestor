"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { getCareer } from "@/lib/genlayer/contract";
import type { Career } from "@/lib/genlayer/types";

export default function CareerPage() {
  const { address } = useWallet();
  const [career, setCareer] = useState<Career | null>(null);
  useEffect(() => { if (address) void getCareer(address).then(setCareer).catch(() => setCareer(null)); }, [address]);
  return <ArenaShell><div className="max-w-4xl mx-auto space-y-6">
    <div><h1 className="font-['Rubik_Mono_One',monospace] text-3xl">Player Career</h1><p className="text-sm text-[#6B6257] mt-2">Wallet-linked finalized outcomes, badges, duels, remixes, and season points.</p></div>
    {!address && <div className="border-2 border-dashed border-[#C99A6B] p-4 font-mono text-sm">Connect an injected wallet to load your career.</div>}
    {career && <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Balance', career.balance], ['Verdicts', career.verdict_count ?? 0], ['Duel wins', career.duel_wins], ['Remixes', career.remix_count ?? 0]].map(([label, value]) => <div key={String(label)} className="border-2 border-[#121212] bg-white p-4 shadow-[3px_3px_0px_#121212]"><p className="text-[10px] uppercase font-black text-[#6B6257]">{label}</p><p className="text-2xl font-black mt-1">{value}</p></div>)}
      </div>
      <div className="border-4 border-[#FFE600] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs uppercase font-black tracking-widest mb-3">Nontransferable badges</p><div className="flex flex-wrap gap-2">{(career.badges ?? []).map((badge) => <Badge key={badge} variant="yellow">{badge}</Badge>)}{!(career.badges ?? []).length && <span className="text-sm text-[#6B6257]">Badges are derived from finalized outcomes.</span>}</div></div>
      <div className="border-2 border-[#0057FF] bg-[#121212] p-4 text-[#D8D0BF] font-mono text-xs"><p className="text-[#00D8C8] uppercase font-black mb-2">Recent chain records</p>{career.recent_events.map((event) => <p key={`${event.result_id}-${event.timestamp}`}>[{event.kind}] {event.result_id} {event.delta >= 0 ? "+" : ""}{event.delta} JP</p>)}</div>
    </>}
  </div></ArenaShell>;
}
