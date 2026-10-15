"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import { getVerdict, getVerdictHistory } from "@/lib/genlayer/contract";
import { verifyFinalizedTransaction, type VerifiedTransaction } from "@/lib/genlayer/client";

export default function VerdictPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [verification, setVerification] = useState<VerifiedTransaction | null>(null);

  useEffect(() => {
    if (!id) return;
    const tx = new URLSearchParams(window.location.search).get("tx");
    void Promise.all([getVerdict(id), getVerdictHistory(id), tx ? verifyFinalizedTransaction(id, tx) : Promise.resolve(null)])
      .then(([value, events, receipt]) => { setResult(value); setHistory(events); setVerification(receipt); })
      .catch(() => {});
  }, [id]);

  return (
    <ArenaShell>
      <div className="max-w-4xl mx-auto space-y-5">
        <div><p className="text-xs uppercase tracking-widest font-black text-[#0057FF]">Permanent result page</p><h1 className="font-['Rubik_Mono_One',monospace] text-3xl mt-1">Verdict {id.slice(0, 12)}</h1></div>
        {!result && <p className="font-mono text-sm text-[#6B6257]">Reading finalized state from Studionet...</p>}
        {result && <>
          <div className="flex gap-2 flex-wrap"><Badge variant={result.finality === "state_finalized" ? "safe" : "chaos"}>{String(result.finality)}</Badge><Badge variant="blue">Independent reassessment</Badge></div>
          <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs uppercase font-black mb-2">Submissions and settlement</p><pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(result, null, 2)}</pre></div>
          <div className="border-2 border-[#7A35FF] bg-white p-4"><p className="text-xs uppercase font-black mb-2">Immutable verdict history</p><pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(history, null, 2)}</pre></div>
          <div className="border-2 border-[#00D8C8] bg-[#121212] p-4 text-xs font-mono text-[#D8D0BF]">
            <p className="text-[#00D8C8] font-black uppercase mb-1">Receipt relationship</p>
            {verification ? <>{verification.verified ? <p className="text-[#35E36D]">Verified finalized transaction {verification.hash} returns this result and reached successful MAJORITY_AGREE execution.</p> : <p className="text-[#FF8BD1]">Not verified: {verification.reason ?? "receipt relationship could not be proven"}.</p>}</> : <p>No transaction hash is treated as authoritative from contract state alone. Share a finalized write URL in the form /verdict/{id}?tx=0x… to verify it in the browser.</p>}
          </div>
        </>}
      </div>
    </ArenaShell>
  );
}
