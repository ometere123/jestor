"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { shortAddress, timeAgo } from "@/lib/jestora/format";
import { useEffect, useState } from "react";
import type { Duel } from "@/lib/genlayer/types";
import type { DuelDraft } from "@/lib/genlayer/duelDrafts";

interface DuelCardProps {
  duel: Duel;
  currentAddress: string;
  onJoin: (duelId: string, entry: string) => Promise<void>;
  onReveal: (duelId: string) => Promise<void>;
  onCancel: (duelId: string) => Promise<void>;
  onRecover: (duelId: string) => Promise<void>;
  onResolve: (duelId: string) => Promise<void>;
  draft: DuelDraft | null;
  isLoading: boolean;
}

export default function DuelCard({ duel, currentAddress, onJoin, onReveal, onCancel, onRecover, onResolve, draft, isLoading }: DuelCardProps) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Math.floor(Date.now() / 1000)), 0);
    const interval = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => { window.clearTimeout(initial); window.clearInterval(interval); };
  }, []);
  const isPlayerA = duel.player_a.toLowerCase() === currentAddress.toLowerCase();
  const isPlayerB = Boolean(duel.player_b) && duel.player_b.toLowerCase() === currentAddress.toLowerCase();
  const canJoin = duel.status === "waiting" && !isPlayerA;
  const canCancel = duel.status === "waiting" && isPlayerA;
  const canReveal = (duel.status === "reveal" || duel.status === "ready")
    && ((isPlayerA && !duel.reveal_a) || (isPlayerB && !duel.reveal_b))
    && Boolean(draft)
    && draft?.phase !== "revealed";
  const canResolve = duel.status === "ready";
  const joinExpired = duel.status === "waiting" && Boolean(duel.join_deadline && now > duel.join_deadline);
  const revealExpired = duel.status === "reveal" && Boolean(duel.reveal_deadline && now > duel.reveal_deadline);
  const canRecover = joinExpired || revealExpired;
  const joinRemaining = duel.join_deadline ? Math.max(0, duel.join_deadline - now) : null;
  const revealRemaining = duel.reveal_deadline ? Math.max(0, duel.reveal_deadline - now) : null;
  const formatRemaining = (seconds: number) => seconds <= 0 ? "expired" : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  return (
    <div data-testid={`duel-card-${duel.id}`} data-duel-id={duel.id} data-duel-status={duel.status} className="border-2 border-[#7A35FF] bg-white p-3 shadow-[3px_3px_0px_#121212] space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[#6B6257]">#{duel.id.slice(0, 8)}</span>
        <Badge variant={duel.status === "resolved" ? "safe" : duel.status === "waiting" ? "blue" : "chaos"}>
          {duel.status}
        </Badge>
      </div>

      <p className="text-xs font-bold text-[#121212]">{duel.prompt_text || "No prompt text"}</p>

      {duel.status === "waiting" && joinRemaining !== null && <p className="text-[11px] font-mono text-[#6B6257]" role="status" aria-live="polite">Join deadline: <time dateTime={new Date((duel.join_deadline ?? 0) * 1000).toISOString()}>{formatRemaining(joinRemaining)}</time></p>}
      {(duel.status === "reveal" || duel.status === "ready") && revealRemaining !== null && <p className="text-[11px] font-mono text-[#6B6257]" role="status" aria-live="polite">Reveal deadline: <time dateTime={new Date((duel.reveal_deadline ?? 0) * 1000).toISOString()}>{formatRemaining(revealRemaining)}</time></p>}

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
      {canCancel && (
        <Button size="sm" variant="danger" onClick={() => onCancel(duel.id)} disabled={isLoading} className="w-full">
          Cancel before opponent joins
        </Button>
      )}
      {canReveal && (
        <Button size="sm" variant="blue" onClick={() => onReveal(duel.id)} disabled={isLoading} className="w-full">
          {isLoading ? "Revealing..." : "Reveal saved entry"}
        </Button>
      )}
      {(isPlayerA || isPlayerB) && (duel.status === "reveal" || duel.status === "ready") && !draft && ((isPlayerA && !duel.reveal_a) || (isPlayerB && !duel.reveal_b)) && (
        <p className="text-[10px] text-[#FF3B30]">This browser has no saved salt for this participant. Reveal is intentionally blocked.</p>
      )}
      {canRecover && (
        <Button size="sm" variant="primary" onClick={() => onRecover(duel.id)} disabled={isLoading} className="w-full">
          Recover expired duel
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
