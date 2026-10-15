"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { createTournament, finalizeTournament, getActivePrompts, getOpenTournaments, joinTournament, recoverTournament, settleTournamentMatch } from "@/lib/genlayer/contract";
import type { Prompt, Tournament } from "@/lib/genlayer/types";

export default function CircuitPage() {
  const { address } = useWallet();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState("");
  const refresh = async () => {
    const [promptRows, tournamentRows] = await Promise.all([getActivePrompts(), getOpenTournaments()]);
    setPrompts(promptRows); setTournaments(tournamentRows);
  };
  useEffect(() => { const timer = window.setTimeout(() => { void refresh().catch(() => {}); }, 0); return () => window.clearTimeout(timer); }, []);

  const create = async () => {
    if (!address || !prompts[0]) return;
    setStatus("Creating scheduled circuit...");
    try { await createTournament(address, prompts[0].id, Math.floor(Date.now() / 1000) + 120); setStatus("Tournament scheduled. Four distinct participants must register."); await refresh(); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : "Could not create tournament."); }
  };
  const join = async (id: string) => {
    if (!address || !entry.trim()) return;
    setStatus("Registering player...");
    try { await joinTournament(address, id, entry); setEntry(""); await refresh(); setStatus("Registered."); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : "Could not register."); }
  };
  const settle = async (id: string, index: number) => {
    if (!address) return;
    setStatus("Settling one bounded round with finalized GenLayer consensus...");
    try { await settleTournamentMatch(address, id, index); await refresh(); setStatus("Round transaction finalized. Challenge windows may still block progression."); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : "Round is not ready."); }
  };
  const finalize = async (id: string) => {
    if (!address) return;
    setStatus("Finalizing only after all settled verdict challenge windows close...");
    try { await finalizeTournament(address, id); await refresh(); setStatus("Tournament final state finalized."); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : "Tournament is not ready for finalization."); }
  };
  const recover = async (id: string) => {
    if (!address) return;
    setStatus("Recovering expired tournament permissionlessly...");
    try { await recoverTournament(address, id); await refresh(); setStatus("Tournament recovery finalized."); }
    catch (e: unknown) { setStatus(e instanceof Error ? e.message : "Tournament has not expired."); }
  };

  return <ArenaShell>
    <div className="max-w-4xl mx-auto space-y-5">
      <div><h1 className="font-['Rubik_Mono_One',monospace] text-3xl">Arena Circuit</h1><p className="text-sm text-[#6B6257] mt-2">Four-player scheduled tournaments: two independently judged semifinals, a challenge-gated final, and no automatic advancement on draws or unsafe outcomes.</p></div>
      <div className="flex gap-2 flex-wrap"><Button onClick={create} disabled={!address || !prompts.length} variant="blue">Schedule Circuit</Button><input value={entry} onChange={(e) => setEntry(e.target.value)} maxLength={400} placeholder="Entry for registration" className="flex-1 min-w-48 border-2 border-[#121212] p-2 font-mono" /></div>
      {status && <p className="text-xs font-mono text-[#6B6257]">{status}</p>}
      {tournaments.map((t) => <div key={t.id} className="border-4 border-[#7A35FF] bg-white p-4 shadow-[4px_4px_0px_#121212] space-y-3">
        <div className="flex justify-between gap-2"><span className="font-mono text-xs">{t.id}</span><Badge variant={t.status === "active" ? "blue" : "yellow"}>{t.stage}</Badge></div>
        <p className="font-bold">{t.prompt_text}</p><p className="text-xs font-mono">{t.players.length}/4 registered · season {t.season}</p>
        <Button size="sm" onClick={() => join(t.id)} disabled={!entry.trim() || !address || t.players.length >= 4 || t.status !== "open"} variant="blue">Join</Button>
        <div className="flex flex-wrap gap-2">{t.matches.map((match, index) => <Button key={String(match.id ?? index)} size="sm" onClick={() => settle(t.id, index)} disabled={match.status !== "pending"} variant="green">Settle {index < 2 ? "semifinal" : "final"}</Button>)}</div>
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => finalize(t.id)} disabled={!address || t.status !== "active"} variant="primary">Finalize settled circuit</Button><Button size="sm" onClick={() => recover(t.id)} disabled={!address || t.finalized} variant="danger">Recover after expiry</Button></div>
        {t.champion && <p className="text-sm font-black text-[#35E36D]">Champion: {t.champion}</p>}
        <pre className="text-[10px] font-mono whitespace-pre-wrap text-[#6B6257]">{t.matches.map((m, i) => "round " + (i + 1) + ": " + String(m.status) + (m.verdict && typeof m.verdict === "object" ? " · " + String((m.verdict as { winner?: unknown }).winner ?? "") : "")).join("\n")}</pre>
      </div>)}
    </div>
  </ArenaShell>;
}
