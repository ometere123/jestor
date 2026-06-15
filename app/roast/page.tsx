"use client";

import { useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import RoastInputPanel from "@/components/roast/RoastInputPanel";
import RoastVerdictCard from "@/components/roast/RoastVerdictCard";
import ConsensusTrace from "@/components/console/ConsensusTrace";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { submitRoastSelf, getProfile } from "@/lib/genlayer/contract";
import { logAction, saveLastVerdict, getTraces } from "@/lib/jestora/localCache";
import { useRequireProfile } from "@/lib/jestora/useRequireProfile";
import type { RoastVerdict, ConsoleTrace } from "@/lib/genlayer/types";

export default function RoastPage() {
  const { address } = useWallet();
  const { profile, setProfile, isCheckingProfile } = useRequireProfile();
  const [verdict, setVerdict] = useState<RoastVerdict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [traces, setTraces] = useState<ConsoleTrace[]>([]);
  const [txStatus, setTxStatus] = useState("");

  const handleSubmit = async (text: string) => {
    if (!address || !profile) return;
    setIsLoading(true);
    setError("");
    setVerdict(null);
    setTxStatus("");
    try {
      logAction("SUBMIT_ROAST", "Submitting self-roast to JestoraArena");
      logAction("SAFETY", "Playfulness and safety check initiated");
      logAction("GENLAYER", "_judge_roast invoked");
      logAction("VALIDATORS", "Checking roast is self-directed and safe, awaiting consensus");
      setTraces(getTraces());
      setTxStatus("Sending to GenLayer...");

      const { hash: _hash, verdict: receiptVerdict } = await submitRoastSelf(address, text);
      setTxStatus("Consensus reached. Reading verdict...");

      const updatedProfile = await getProfile(address);
      setProfile(updatedProfile);

      if (receiptVerdict && typeof receiptVerdict.outcome === "string") {
        const v = receiptVerdict as unknown as RoastVerdict;
        setVerdict(v);
        saveLastVerdict(v);
        logAction("CONSENSUS", `outcome: ${v.outcome}`);
        logAction("CAP", `delta ${v.actual_delta ?? v.balance_delta} within roast_max 40`);
        logAction("BALANCE", `+${v.actual_delta ?? v.balance_delta} Jest Points applied`);
      } else {
        logAction("CONSENSUS", "Judged, verdict stored on-chain");
      }
      setTraces(getTraces());
      setTxStatus("");
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Submission failed.";
      setError(msg);
      setTxStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ArenaShell>
      <div className="max-w-3xl mx-auto space-y-6">
        {address && isCheckingProfile && (
          <div className="border-2 border-[#0057FF] bg-white p-4 text-sm font-mono text-[#6B6257]">
            Checking profile on-chain...
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Roast Balance</h1>
          <Badge variant="unsafe">Self-Roast Only</Badge>
          {profile && (
            <span className="ml-auto text-sm font-black text-[#6B6257]">
              Balance: <span className="text-[#121212]">{profile.balance}</span> JP
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-4 border-[#FF3B30] bg-white p-4 shadow-[4px_4px_0px_#121212]">
            <p className="text-xs font-black uppercase tracking-widest text-[#6B6257] mb-3">Submit Roast</p>
            <RoastInputPanel onSubmit={handleSubmit} isLoading={isLoading} />
            {error && <p className="text-xs text-[#FF3B30] mt-2">{error}</p>}
            {txStatus && (
              <p className="text-[10px] font-mono text-[#0057FF] mt-2 animate-pulse">{txStatus}</p>
            )}
          </div>

          <div className="space-y-4">
            {verdict && <RoastVerdictCard verdict={verdict} />}
            {!verdict && validatorRan(traces) && (
              <div className="border-2 border-[#35E36D] bg-white p-4 text-sm font-mono text-[#6B6257]">
                Judged on-chain. Check your balance above for the result.
              </div>
            )}
            {traces.length > 0 && <ConsensusTrace traces={traces} />}
          </div>
        </div>

        <div className="border-2 border-dashed border-[#C99A6B] p-3 text-xs text-[#6B6257]">
          <p className="font-black mb-1">Self-roast rules:</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>Roast only yourself: your balance, captions, or meme choices.</li>
            <li>No attacks on other users, protected classes, or real-world people.</li>
            <li>No self-harm encouragement. Playful only.</li>
            <li>GenLayer validators judge playfulness and safety before any reward.</li>
          </ul>
        </div>
      </div>
    </ArenaShell>
  );
}

function validatorRan(traces: ConsoleTrace[]) {
  return traces.some((t) => t.step === "CONSENSUS" || t.step === "BALANCE");
}
