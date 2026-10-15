"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import RoastInputPanel from "@/components/roast/RoastInputPanel";
import RoastVerdictCard from "@/components/roast/RoastVerdictCard";
import ReceiptEvidencePanel from "@/components/console/ReceiptEvidencePanel";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { getActivePrompts, getProfile, submitRoastSelf } from "@/lib/genlayer/contract";
import { saveLastVerdict } from "@/lib/jestora/localCache";
import { useRequireProfile } from "@/lib/jestora/useRequireProfile";
import type { Prompt, RoastVerdict } from "@/lib/genlayer/types";
import type { ReceiptEvidence } from "@/lib/genlayer/client";

export default function RoastPage() {
  const { address } = useWallet();
  const { profile, setProfile, isCheckingProfile } = useRequireProfile();
  const [verdict, setVerdict] = useState<RoastVerdict | null>(null);
  const [receipt, setReceipt] = useState<ReceiptEvidence | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => { void getActivePrompts().then(setPrompts).catch(() => setPrompts([])); }, []);

  const handleSubmit = async (text: string) => {
    if (!address || !profile || !prompts[0]) return;
    setIsLoading(true); setError(""); setVerdict(null); setReceipt(null); setTxHash(null);
    setTxStatus("Sending to GenLayer and waiting for a finalized receipt...");
    try {
      const result = await submitRoastSelf(address, prompts[0].id, text);
      setTxHash(result.hash); setReceipt(result.evidence);
      const updated = await getProfile(address); setProfile(updated);
      if (result.verdict && typeof result.verdict.outcome === "string") {
        const next = result.verdict as unknown as RoastVerdict;
        setVerdict(next); saveLastVerdict(next);
      }
      setTxStatus("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed."); setTxStatus("");
    } finally { setIsLoading(false); }
  };

  return (
    <ArenaShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {address && isCheckingProfile && <div className="border-2 border-[#0057FF] bg-white p-4 text-sm font-mono text-[#6B6257]">Reading your finalized on-chain career...</div>}
        <div className="flex items-center gap-3 flex-wrap"><h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Roast Balance</h1><Badge variant="unsafe">Self-Roast Only</Badge>{profile && <span className="ml-auto text-sm font-black text-[#6B6257]">Balance: <span className="text-[#121212]">{profile.balance}</span> JP</span>}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-[#FF3B30] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">Submit Roast</p><p className="text-xs text-[#6B6257] mb-3">Prompt: {prompts[0]?.text ?? "No active on-chain prompt"}</p><RoastInputPanel onSubmit={handleSubmit} isLoading={isLoading} />{error && <p className="text-xs text-[#FF3B30] mt-2">{error}</p>}{txStatus && <p className="text-[10px] font-mono text-[#0057FF] mt-2 animate-pulse">{txStatus}</p>}</div>
          <div className="space-y-4">{verdict && <RoastVerdictCard verdict={verdict} />}{txHash && receipt && <ReceiptEvidencePanel hash={txHash} evidence={receipt} />}</div>
        </div>
        <div className="border-2 border-dashed border-[#C99A6B] p-3 text-xs text-[#6B6257]"><p className="font-black mb-1">Self-roast rules:</p><ul className="space-y-0.5 list-disc list-inside"><li>Roast only yourself: your balance, captions, or meme choices.</li><li>No attacks on other users, protected classes, or real-world people.</li><li>No self-harm encouragement. Playful only.</li><li>GenLayer validators independently reassess playfulness and safety.</li></ul></div>
      </div>
    </ArenaShell>
  );
}
