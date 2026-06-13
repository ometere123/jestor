"use client";

import { useState, useEffect } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import CaptionSubmitForm from "@/components/caption/CaptionSubmitForm";
import CaptionVerdictPanel from "@/components/caption/CaptionVerdictPanel";
import PromptCarousel from "@/components/caption/PromptCarousel";
import ConsensusTrace from "@/components/console/ConsensusTrace";
import BalanceMutationPanel from "@/components/console/BalanceMutationPanel";
import ValidatorMoodGrid from "@/components/console/ValidatorMoodGrid";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { submitCaption, getProfile, getActivePrompts } from "@/lib/genlayer/contract";
import { logAction, saveLastVerdict, getTraces } from "@/lib/jestora/localCache";
import type { Prompt, CaptionVerdict, ConsoleTrace, PlayerProfile } from "@/lib/genlayer/types";

export default function CaptionRiftPage() {
  const { address, isConnected, connect } = useWallet();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [verdict, setVerdict] = useState<CaptionVerdict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [traces, setTraces] = useState<ConsoleTrace[]>([]);
  const [validatorState, setValidatorState] = useState<"idle" | "running" | "consensus">("idle");
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [balanceBefore, setBalanceBefore] = useState<number | undefined>();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => {
    getActivePrompts().then(setPrompts);
    if (address) getProfile(address).then(setProfile);
  }, [address]);

  const handleSubmit = async (caption: string) => {
    if (!address || !selectedPrompt) return;
    setIsLoading(true);
    setError("");
    setVerdict(null);
    setValidatorState("idle");
    setTxStatus("");
    const before = profile?.balance ?? 0;
    setBalanceBefore(before);

    try {
      logAction("SUBMIT_CAPTION", `Round: ${selectedPrompt.id} — submitting`);
      logAction("SAFETY", "Client pre-flight safety check passed");
      logAction("GENLAYER", "_judge_caption invoked on JestoraArena");
      logAction("VALIDATORS", "Humour equivalence check — awaiting consensus");
      setTraces(getTraces());
      setValidatorState("running");
      setTxStatus("Sending to GenLayer...");

      const { hash, verdict: receiptVerdict } = await submitCaption(address, selectedPrompt.id, caption);
      setTxHash(hash);
      setTxStatus("Consensus reached. Reading verdict...");

      // Re-fetch profile for updated balance (source of truth)
      const updatedProfile = await getProfile(address);
      setProfile(updatedProfile);

      if (receiptVerdict && typeof receiptVerdict.outcome === "string") {
        // Got the verdict from the tx receipt eq_outputs
        const v = receiptVerdict as unknown as CaptionVerdict;
        setVerdict(v);
        saveLastVerdict(v);
        logAction("CONSENSUS", `outcome: ${v.outcome}`);
        logAction("CAP", `requested ${v.raw_delta_requested ?? v.balance_delta}, capped to ${v.actual_delta ?? v.balance_delta}`);
        logAction("BALANCE", `+${v.actual_delta ?? v.balance_delta} Jest Points applied`);
      } else {
        // Receipt didn't include verdict — compute delta from balance diff
        const after = updatedProfile?.balance ?? before;
        const delta = after - before;
        logAction("CONSENSUS", "Judged — verdict stored on-chain");
        logAction("BALANCE", `${delta >= 0 ? "+" : ""}${delta} Jest Points applied`);
      }
      logAction("EVENT", "ChaosFeed updated");
      setValidatorState("consensus");
      setTraces(getTraces());
      setTxStatus("");
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Submission failed.";
      setError(msg);
      logAction("ERROR", msg);
      setTraces(getTraces());
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <ArenaShell>
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="font-['Rubik_Mono_One',monospace] text-2xl">Connect Wallet</p>
          <button onClick={connect} className="w-full bg-[#FFE600] border-2 border-[#121212] px-4 py-2 font-black uppercase text-sm shadow-[3px_3px_0px_#121212]">
            Connect
          </button>
        </div>
      </ArenaShell>
    );
  }

  return (
    <ArenaShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Caption Rift</h1>
          <Badge variant="blue">GenLayer Judged</Badge>
          {profile && (
            <span className="ml-auto text-sm font-black text-[#6B6257]">
              Balance: <span className="text-[#121212]">{profile.balance}</span> JP
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — input */}
          <div className="space-y-4">
            <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
              <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">
                1. Select a Prompt
              </p>
              <PromptCarousel
                prompts={prompts}
                selectedId={selectedPrompt?.id ?? null}
                onSelect={setSelectedPrompt}
              />
            </div>

            <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
              <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">
                2. Write Your Caption
              </p>
              <CaptionSubmitForm
                promptId={selectedPrompt?.id ?? null}
                promptText={selectedPrompt?.text ?? ""}
                senderAddress={address ?? ""}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
              {error && <p className="text-xs text-[#FF3B30] mt-2">{error}</p>}
              {txStatus && (
                <p className="text-[10px] font-mono text-[#0057FF] mt-2 animate-pulse">{txStatus}</p>
              )}
              {txHash && !txStatus && (
                <p className="text-[10px] font-mono text-[#6B6257] mt-2">tx: {txHash.slice(0, 20)}...</p>
              )}
            </div>
          </div>

          {/* Right — verdict + console */}
          <div className="space-y-4">
            {verdict && (
              <div className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
                <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">Verdict</p>
                <CaptionVerdictPanel verdict={verdict} />
                <div className="mt-3">
                  <BalanceMutationPanel
                    rawDelta={verdict.raw_delta_requested}
                    actualDelta={verdict.actual_delta ?? verdict.balance_delta}
                    balanceBefore={balanceBefore}
                    balanceAfter={(balanceBefore ?? 0) + (verdict.actual_delta ?? verdict.balance_delta)}
                  />
                </div>
              </div>
            )}

            {validatorState !== "idle" && (
              <ValidatorMoodGrid state={validatorState} />
            )}

            {traces.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-2">Consensus Trace</p>
                <ConsensusTrace traces={traces} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ArenaShell>
  );
}
