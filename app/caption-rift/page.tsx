"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import CaptionSubmitForm from "@/components/caption/CaptionSubmitForm";
import CaptionVerdictPanel from "@/components/caption/CaptionVerdictPanel";
import PromptCarousel from "@/components/caption/PromptCarousel";
import BalanceMutationPanel from "@/components/console/BalanceMutationPanel";
import ReceiptEvidencePanel from "@/components/console/ReceiptEvidencePanel";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { getActivePrompts, getProfile, submitCaption } from "@/lib/genlayer/contract";
import { saveLastVerdict } from "@/lib/jestora/localCache";
import { useRequireProfile } from "@/lib/jestora/useRequireProfile";
import type { Prompt, CaptionVerdict } from "@/lib/genlayer/types";
import type { ReceiptEvidence } from "@/lib/genlayer/client";

export default function CaptionRiftPage() {
  const { address, isConnected, connect } = useWallet();
  const { profile, setProfile, isCheckingProfile } = useRequireProfile();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [verdict, setVerdict] = useState<CaptionVerdict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [balanceBefore, setBalanceBefore] = useState<number | undefined>();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptEvidence | null>(null);
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => { void getActivePrompts().then(setPrompts).catch(() => setPrompts([])); }, []);

  const handleSubmit = async (caption: string) => {
    if (!address || !selectedPrompt || !profile) return;
    setIsLoading(true);
    setError("");
    setVerdict(null);
    setTxHash(null);
    setReceipt(null);
    setTxStatus("Sending to GenLayer and waiting for a finalized receipt...");
    const before = profile.balance;
    setBalanceBefore(before);
    try {
      const result = await submitCaption(address, selectedPrompt.id, caption);
      setTxHash(result.hash);
      setReceipt(result.evidence);
      const updatedProfile = await getProfile(address);
      setProfile(updatedProfile);
      if (result.verdict && typeof result.verdict.outcome === "string") {
        const next = result.verdict as unknown as CaptionVerdict;
        setVerdict(next);
        saveLastVerdict(next);
      }
      setTxStatus("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return <ArenaShell><div className="max-w-md mx-auto mt-20 text-center space-y-4"><p className="font-['Rubik_Mono_One',monospace] text-2xl">Connect Wallet</p><button onClick={connect} className="w-full bg-[#FFE600] border-2 border-[#121212] px-4 py-2 font-black uppercase text-sm shadow-[3px_3px_0px_#121212]">Connect</button></div></ArenaShell>;
  }
  if (address && isCheckingProfile) {
    return <ArenaShell><div className="max-w-md mx-auto mt-20 text-center space-y-4"><p className="font-['Rubik_Mono_One',monospace] text-2xl">Checking Profile</p><p className="text-sm text-[#6B6257]">Reading your finalized on-chain career.</p></div></ArenaShell>;
  }

  return (
    <ArenaShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap"><h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Caption Rift</h1><Badge variant="blue">GenLayer Judged</Badge>{profile && <span className="ml-auto text-sm font-black text-[#6B6257]">Balance: <span className="text-[#121212]">{profile.balance}</span> JP</span>}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">1. Select a Prompt</p><PromptCarousel prompts={prompts} selectedId={selectedPrompt?.id ?? null} onSelect={setSelectedPrompt} /></div>
            <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
              <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">2. Write Your Caption</p>
              <CaptionSubmitForm promptId={selectedPrompt?.id ?? null} promptText={selectedPrompt?.text ?? ""} onSubmit={handleSubmit} isLoading={isLoading} />
              {error && <p className="text-xs text-[#FF3B30] mt-2">{error}</p>}
              {txStatus && <p className="text-[10px] font-mono text-[#0057FF] mt-2 animate-pulse">{txStatus}</p>}
            </div>
          </div>
          <div className="space-y-4">
            {verdict && <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]"><p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">Verdict</p><CaptionVerdictPanel verdict={verdict} /><div className="mt-3"><BalanceMutationPanel rawDelta={verdict.raw_delta_requested} actualDelta={verdict.actual_delta ?? verdict.balance_delta} balanceBefore={balanceBefore} balanceAfter={(balanceBefore ?? 0) + (verdict.actual_delta ?? verdict.balance_delta)} /></div></div>}
            {txHash && receipt && <ReceiptEvidencePanel hash={txHash} evidence={receipt} />}
          </div>
        </div>
      </div>
    </ArenaShell>
  );
}
