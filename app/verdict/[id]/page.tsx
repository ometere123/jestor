"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import { getVerdict, getVerdictHistory } from "@/lib/genlayer/contract";

export default function VerdictPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  useEffect(() => { if (id) void Promise.all([getVerdict(id), getVerdictHistory(id)]).then(([value, events]) => { setResult(value); setHistory(events); }).catch(() => {}); }, [id]);
  return <ArenaShell><div className="max-w-4xl mx-auto space-y-5"><div><p className="text-xs uppercase tracking-widest font-black text-[#0057FF]">Permanent result page</p><h1 className="font-['Rubik_Mono_One',monospace] text-3xl mt-1">Verdict {id.slice(0, 12)}</h1></div>{!result && <p className="font-mono text-sm text-[#6B6257]">Reading finalized state from Studionet...</p>}{result && <><div className="flex gap-2"><Badge variant={result.finality === "contract_state_finalized" ? "safe" : "chaos"}>{String(result.finality)}</Badge><Badge variant="blue">Independent reassessment</Badge></div><div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs uppercase font-black mb-2">Submissions and settlement</p><pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(result, null, 2)}</pre></div><div className="border-2 border-[#7A35FF] bg-white p-4"><p className="text-xs uppercase font-black mb-2">Immutable verdict history</p><pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(history, null, 2)}</pre></div><p className="text-xs text-[#6B6257]">Transaction hashes appear here only when recorded against the finalized result. Consensus status is read from chain state; UI animations are not consensus evidence.</p></>}</div></ArenaShell>;
}
