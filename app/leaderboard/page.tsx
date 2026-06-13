"use client";

import { useState, useEffect } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import Sticker from "@/components/ui/Sticker";
import { getTierLabel, getTierColor } from "@/lib/jestora/balanceRules";
import { shortAddress } from "@/lib/jestora/format";
import { getLeaderboard, getProtocolStats } from "@/lib/genlayer/contract";
import type { LeaderboardEntry, ProtocolStats } from "@/lib/genlayer/types";

const RANK_COLORS = ["#FFE600", "#D8D0BF", "#C99A6B", "#FFF8E7"];
const RANK_LABELS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLeaderboard(), getProtocolStats()])
      .then(([lb, s]) => { setEntries(lb); setStats(s); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ArenaShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Leaderboard</h1>
          <Badge variant="yellow">Jest Points</Badge>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Players", value: stats.total_profiles },
              { label: "Submissions", value: stats.total_submissions },
              { label: "Duels", value: stats.total_duels },
              { label: "Chaos", value: stats.total_chaos_actions },
            ].map(({ label, value }) => (
              <div key={label} className="border-2 border-[#121212] bg-white p-2 text-center shadow-[2px_2px_0px_#121212]">
                <p className="font-['Rubik_Mono_One',monospace] text-xl text-[#121212]">{value}</p>
                <p className="text-[10px] font-black uppercase text-[#6B6257]">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-4 border-[#121212] bg-white shadow-[6px_6px_0px_#121212]">
          <div className="border-b-4 border-[#FFE600] bg-[#FFE600] px-4 py-2">
            <p className="font-['Rubik_Mono_One',monospace] text-sm">TOP JESTERS BY TOY BALANCE</p>
          </div>
          <div className="divide-y-2 divide-[#D8D0BF]">
            {loading && (
              <div className="p-4 text-center text-sm text-[#6B6257] font-mono">Loading leaderboard...</div>
            )}
            {!loading && entries.length === 0 && (
              <div className="p-4 text-center text-sm text-[#6B6257] font-mono">No players yet.</div>
            )}
            {entries.map((entry, i) => (
              <div key={entry.address} className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: i < 3 ? RANK_COLORS[i] + "33" : "transparent" }}>
                <span className="text-xl w-8 text-center">{RANK_LABELS[i] ?? `${i + 1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#121212] truncate">{entry.alias}</p>
                  <p className="text-[10px] font-mono text-[#6B6257]">{shortAddress(entry.address)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-['Rubik_Mono_One',monospace] text-lg ${getTierColor(entry.balance)}`}>
                    {entry.balance.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-black uppercase text-[#6B6257]">{getTierLabel(entry.balance)}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-black text-[#7A35FF]">{entry.duel_wins}W</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-2 border-dashed border-[#C99A6B] p-3 text-xs text-[#6B6257] text-center">
          Jest Points have no monetary value. This leaderboard is for gameplay only. No financial prizes.
        </div>
      </div>
    </ArenaShell>
  );
}
