"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { shortAddress, timeAgo } from "@/lib/jestora/format";
import type { Duel } from "@/lib/genlayer/types";

interface DuelCardProps {
  duel: Duel;
  currentAddress: string;
  onJoin: (duelId: string, entry: string) => Promise<void>;
  onResolve: (duelId: string) => Promise<void>;
  isLoading: boolean;
}

export default function DuelCard({ duel, currentAddress, onJoin, onResolve, isLoading }: DuelCardProps) {
  const isPlayerA = duel.player_a === currentAddress;
  const canJoin = duel.status === "waiting" && !isPlayerA;
  const canResolve = duel.status === "ready";

  return (
    <div className="border-2 border-[#7A35FF] bg-white p-3 shadow-[3px_3px_0px_#121212] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#6B6257]">#{duel.id.slice(0, 8)}</span>
        <Badge variant={duel.status === "resolved" ? "safe" : duel.status === "waiting" ? "blue" : "chaos"}>
          {duel.status}
        </Badge>
      </div>

      <p className="text-xs font-bold text-[#121212]">{duel.prompt_text || "No prompt text"}</p>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="border border-[#C99A6B] p-1">
          <p className="text-[#6B6257]">Player A</p>
          <p className="font-black">{shortAddress(duel.player_a)}</p>
        </div>
        <div className="border border-[#C99A6B] p-1">
          <p className="text-[#6B6257]">Player B</p>
          <p className="font-black">{duel.player_b ? shortAddress(duel.player_b) : "Waiting..."}</p>
        </div>
      </div>

      {duel.verdict && (
        <div className="border-l-4 border-[#35E36D] pl-2">
          <p className="text-xs font-black text-[#35E36D]">Winner: {duel.verdict.winner}</p>
          <p className="text-xs text-[#6B6257] font-mono">{duel.verdict.reason}</p>
        </div>
      )}

      {canJoin && (
        <Button size="sm" variant="blue" onClick={() => {
          const entry = prompt("Your duel entry:");
          if (entry) onJoin(duel.id, entry);
        }} disabled={isLoading} className="w-full">
          Join Duel
        </Button>
      )}
      {canResolve && (
        <Button size="sm" variant="green" onClick={() => onResolve(duel.id)} disabled={isLoading} className="w-full">
          {isLoading ? "Resolving..." : "Resolve Duel via GenLayer"}
        </Button>
      )}

      <p className="text-[10px] text-[#C99A6B]">{timeAgo(duel.created_at)}</p>
    </div>
  );
}
