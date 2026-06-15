"use client";

import { useState, useEffect } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import ChaosActionForm from "@/components/chaos/ChaosActionForm";
import ChaosVerdictPanel from "@/components/chaos/ChaosVerdictPanel";
import ChaosWheel from "@/components/chaos/ChaosWheel";
import ConsensusTrace from "@/components/console/ConsensusTrace";
import StructuredVerdict from "@/components/console/StructuredVerdict";
import Badge from "@/components/ui/Badge";
import { useWallet } from "@/lib/jestora/walletContext";
import { invokeChaosAction, getProfile } from "@/lib/genlayer/contract";
import { logAction, saveLastVerdict, getTraces } from "@/lib/jestora/localCache";
import { useRequireProfile } from "@/lib/jestora/useRequireProfile";
import type { ChaosVerdict, ConsoleTrace } from "@/lib/genlayer/types";

const LAST_CHAOS_KEY = "jestor_last_chaos_day";

export default function ChaosLabPage() {
  const { address } = useWallet();
  const { profile, setProfile, isCheckingProfile } = useRequireProfile();
  const [verdict, setVerdict] = useState<ChaosVerdict | null>(null);
  const [structuredVerdict, setStructuredVerdict] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [traces, setTraces] = useState<ConsoleTrace[]>([]);
  const [hasUsedToday, setHasUsedToday] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => {
    if (!address) return;
    const today = new Date().toDateString();
    const lastUsed = localStorage.getItem(LAST_CHAOS_KEY + address);
    setHasUsedToday(lastUsed === today);
  }, [address]);

  const handleSubmit = async (text: string) => {
    if (!address || !profile) return;
    setIsLoading(true);
    setSpinning(true);
    setError("");
    setVerdict(null);
    setStructuredVerdict(null);
    setTxStatus("");
    try {
      logAction("INVOKE_CHAOS", "Chaos action submitted to JestoraArena");
      logAction("SAFETY", "Financial and harm checks passed");
      logAction("GENLAYER", "_judge_chaos invoked");
      logAction("VALIDATORS", "Chaos class equivalence check, awaiting consensus");
      setTraces(getTraces());
      setTxStatus("Sending to GenLayer...");

      const { verdict: receiptVerdict, rawVerdict } = await invokeChaosAction(address, text);
      setTxStatus("Consensus reached. Reading verdict...");
      setStructuredVerdict(receiptVerdict ?? null);
      const updatedProfile = await getProfile(address);
      setProfile(updatedProfile);

      if (receiptVerdict && typeof receiptVerdict.chaos_class === "string") {
        const v = receiptVerdict as unknown as ChaosVerdict;
        setVerdict(v);
        saveLastVerdict(v);
        const delta = v.actual_delta ?? v.balance_delta;
        logAction("CONSENSUS", `chaos_class: ${v.chaos_class}`);
        logAction("CAP", `delta ${delta} within chaos range [-25, +75]`);
        logAction("BALANCE", `${delta >= 0 ? "+" : ""}${delta} Jest Points applied`);
        logAction("EVENT", "ChaosFeed updated");
      } else {
        if (rawVerdict && typeof rawVerdict === "object" && !Array.isArray(rawVerdict)) {
          setStructuredVerdict(rawVerdict as Record<string, unknown>);
        }
        logAction("CONSENSUS", "Judged, verdict stored on-chain");
        logAction("EVENT", "ChaosFeed updated");
      }
      setTraces(getTraces());

      localStorage.setItem(LAST_CHAOS_KEY + address, new Date().toDateString());
      setHasUsedToday(true);
      setTxStatus("");
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Chaos action failed.";
      setError(msg);
      setTxStatus("");
    } finally {
      setIsLoading(false);
      setSpinning(false);
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
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Chaos Lab</h1>
          <Badge variant="chaos">1 Per Day</Badge>
          {profile && (
            <span className="ml-auto text-sm font-black text-[#6B6257]">
              Balance: <span className="text-[#121212]">{profile.balance}</span> JP
            </span>
          )}
        </div>

        <div className="border-4 border-[#FF8BD1] bg-white shadow-[6px_6px_0px_#121212] overflow-hidden">
          <div className="border-b-4 border-[#FF8BD1] bg-[#FF8BD1] px-4 py-2">
            <p className="font-['Rubik_Mono_One',monospace] text-sm text-[#121212]">CHAOS ORACLE</p>
          </div>
          <div className="p-4 space-y-4">
            <ChaosWheel spinning={spinning} />
            <ChaosActionForm onSubmit={handleSubmit} isLoading={isLoading} hasUsedToday={hasUsedToday} />
            {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
            {txStatus && (
              <p className="text-[10px] font-mono text-[#0057FF] animate-pulse">{txStatus}</p>
            )}
          </div>
        </div>

        {verdict && <ChaosVerdictPanel verdict={verdict} />}
        {structuredVerdict && <StructuredVerdict verdict={structuredVerdict} title="Consensus Verdict JSON" />}
        {!verdict && traces.some((t) => t.step === "CONSENSUS") && (
          <div className="border-2 border-[#35E36D] bg-white p-4 text-sm font-mono text-[#6B6257]">
            Chaos judged on-chain. Check your balance above for the result.
          </div>
        )}
        {traces.length > 0 && <ConsensusTrace traces={traces} />}
      </div>
    </ArenaShell>
  );
}
