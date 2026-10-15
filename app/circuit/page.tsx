"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import Button from "@/components/ui/Button";
import { useWallet } from "@/lib/jestora/walletContext";
import { createTournament, getActivePrompts, getOpenTournaments, joinTournament, settleTournamentMatch } from "@/lib/genlayer/contract";
import type { Prompt, Tournament } from "@/lib/genlayer/types";

export default function CircuitPage() {
  const { address } = useWallet();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState("");
  const refresh = async () => { const [p, t] = await Promise.all([getActivePrompts(), getOpenTournaments()]); setPrompts(p); setTournaments(t); };
  useEffect(() => { const timer = window.setTimeout(() => { void refresh().catch(() => {}); }, 0); return () => window.clearTimeout(timer); }, []);
  const create = async () => { if (!address || !prompts[0]) return; setStatus("Creating scheduled circuit..."); try { await createTournament(address, prompts[0].id, Math.floor(Date.now() / 1000) + 120); setStatus("Tournament scheduled. Four players must register before the deadline."); await refresh(); } catch (e: unknown) { setStatus((e as Error).message ?? "Could not create tournament."); } };
  const join = async (id: string) => { if (!address || !entry.trim()) return; setStatus("Registering player..."); try { await joinTournament(address, id, entry); setEntry(""); await refresh(); setStatus("Registered."); } catch (e: unknown) { setStatus((e as Error).message ?? "Could not register."); } };
  const settle = async (id: string, index: number) => { if (!address) return; setStatus("Settling one bounded round with GenLayer consensus..."); try { await settleTournamentMatch(address, id, index); await refresh(); setStatus("Round finalized."); } catch (e: unknown) { setStatus((e as Error).message ?? "Round is not ready."); } };
  return <ArenaShell>
    <div className="max-w-4xl mx-auto space-y-5">
      <div><h1 className="font-['Rubik_Mono_One',monospace] text-3xl">Arena Circuit</h1><p className="text-sm text-[#6B6257] mt-2">Four-player scheduled tournaments: two semifinals, then a final, all permissionlessly settleable.</p></div>
      <div className="flex gap-2"><Button onClick={create} disabled={!address || !prompts.length} variant="blue">Schedule Circuit</Button><input value={entry} onChange={(e) => setEntry(e.target.value)} maxLength={400} placeholder="Entry for registration" className="flex-1 border-2 border-[#121212] p-2 font-mono" /></div>
      {status && <p className="text-xs font-mono text-[#6B6257]">{status}</p>}
      {tournaments.map((t) => <div key={t.id} className="border-4 border-[#7A35FF] bg-white p-4 shadow-[4px_4px_0px_#121212] space-y-3">
        <div className="flex justify-between"><span className="font-mono text-xs">{t.id}</span><span className="font-black uppercase text-xs">{t.stage}</span></div>
        <p className="font-bold">{t.prompt_text}</p><p className="text-xs font-mono">{t.players.length}/4 registered · season {t.season}</p>
        <Button size="sm" onClick={() => join(t.id)} disabled={!entry.trim() || !address || t.players.length >= 4} variant="blue">Join</Button>
        {t.matches.map((match, index) => <Button key={String(match.id ?? index)} size="sm" onClick={() => settle(t.id, index)} disabled={match.status !== "pending"} variant="green">Settle round {index + 1}</Button>)}
      </div>)}
    </div>
  </ArenaShell>;
}
