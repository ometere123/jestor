"use client";

import { useState, useEffect, useCallback } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import DuelCreateForm from "@/components/duels/DuelCreateForm";
import DuelCard from "@/components/duels/DuelCard";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { startDuel, joinDuel, resolveDuel, getDuel, getLatestDuelId, getOpenDuels, getAllDuels } from "@/lib/genlayer/contract";
import { useRequireProfile } from "@/lib/jestora/useRequireProfile";
import type { Duel } from "@/lib/genlayer/types";

export default function DuelsPage() {
  const { address } = useWallet();
  const { profile, isCheckingProfile } = useRequireProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [error, setError] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loadingDuels, setLoadingDuels] = useState(true);

  const refreshDuels = useCallback(async () => {
    try {
      const [open, all] = await Promise.all([getOpenDuels(), getAllDuels()]);
      const resolved = all.filter(d =>
        d.status !== "waiting" &&
        (d.player_a?.toLowerCase() === address?.toLowerCase() ||
         d.player_b?.toLowerCase() === address?.toLowerCase())
      );
      const seen = new Set<string>();
      const merged: Duel[] = [];
      for (const d of [...open, ...resolved]) {
        if (!seen.has(d.id)) { seen.add(d.id); merged.push(d); }
      }
      merged.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
      setActiveDuels(merged);
    } catch { /* ignore */ }
    finally { setLoadingDuels(false); }
  }, [address]);

  useEffect(() => {
    refreshDuels();
    const interval = setInterval(refreshDuels, 15000);
    return () => clearInterval(interval);
  }, [refreshDuels]);

  const handleCreateDuel = async (promptId: string, entry: string) => {
    if (!address || !profile) return;
    setIsLoading(true);
    setError("");
    setTxStatus("Sending to GenLayer...");
    try {
      await startDuel(address, promptId, entry);
      setTxStatus("Reading duel from chain...");
      const duelId = await getLatestDuelId(address);
      if (!duelId) {
        setError("Duel started but could not fetch ID. Please refresh.");
        return;
      }
      setTxStatus("Refreshing duel list...");
      await refreshDuels();
      setTxStatus("");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to create duel.");
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (duelId: string, entry: string) => {
    if (!address || !profile) return;
    setIsLoading(true);
    setTxStatus("Joining duel on GenLayer...");
    try {
      await joinDuel(address, duelId, entry);
      setTxStatus("Refreshing...");
      await refreshDuels();
      setTxStatus("");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to join duel.");
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (duelId: string) => {
    if (!address || !profile) return;
    setIsLoading(true);
    setTxStatus("Resolving duel, waiting for consensus...");
    try {
      await resolveDuel(address, duelId);
      setTxStatus("Reading result...");
      await refreshDuels();
      setTxStatus("");
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to resolve duel.");
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ArenaShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {address && isCheckingProfile && (
          <div className="border-2 border-[#0057FF] bg-white p-4 text-sm font-mono text-[#6B6257]">
            Checking profile on-chain...
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Meme Duels</h1>
          <Badge variant="purple">GenLayer Judged</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border-4 border-[#7A35FF] bg-white p-4 shadow-[4px_4px_0px_#121212]">
            <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">Start a Duel</p>
            <DuelCreateForm onSubmit={handleCreateDuel} isLoading={isLoading} />
            {error && <p className="text-xs text-[#FF3B30] mt-2">{error}</p>}
            {txStatus && (
              <p className="text-[10px] font-mono text-[#0057FF] mt-2 animate-pulse">{txStatus}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-black uppercase tracking-widest text-[#6B6257]">Open Duels</p>
              {!loadingDuels && <span className="text-[10px] font-mono text-[#6B6257]">(live · refreshes every 15s)</span>}
            </div>
            {loadingDuels && (
              <p className="text-sm text-[#6B6257] font-mono animate-pulse">Loading duels from chain...</p>
            )}
            {!loadingDuels && activeDuels.length === 0 && (
              <p className="text-sm text-[#6B6257] font-mono">No open duels. Start one.</p>
            )}
            {activeDuels.map((duel) => (
              <DuelCard
                key={duel.id}
                duel={duel}
                currentAddress={address ?? ""}
                onJoin={handleJoin}
                onResolve={handleResolve}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>

        <div className="border-2 border-dashed border-[#C99A6B] p-3 text-xs text-[#6B6257]">
          <p className="font-black mb-1">Duel rules:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Two players submit to the same prompt. Entries stay hidden until resolved.</li>
            <li>GenLayer validators judge humour, originality, safety, and prompt fit.</li>
            <li>Winner gets up to +60 Jest Points. Loser gets up to +10 for participation.</li>
            <li>No financial stakes. Jest Points have no monetary value.</li>
          </ul>
        </div>
      </div>
    </ArenaShell>
  );
}
