"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { challengeVerdict, getBalance, getProfile, getVerdict, getVerdictHistory } from "@/lib/genlayer/contract";
import { TARGET_CHAIN_ID, verifyFinalizedChallengeTransaction, verifyFinalizedTransaction, type VerifiedTransaction } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/jestora/walletContext";
import type { PlayerProfile } from "@/lib/genlayer/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function countdown(seconds: number): string {
  if (seconds <= 0) return "closed";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0 ? `${hours}h ${minutes}m ${remainder}s` : `${minutes}m ${remainder}s`;
}

function participantAddresses(result: Record<string, unknown>): string[] {
  return [result.author, result.player_a, result.player_b]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => value.toLowerCase());
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function VerdictPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { address, chainId, connect } = useWallet();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [verification, setVerification] = useState<VerifiedTransaction | null>(null);
  const [challengeVerification, setChallengeVerification] = useState<VerifiedTransaction | null>(null);
  const [reason, setReason] = useState("");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [loading, setLoading] = useState(true);
  const [challenging, setChallenging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tx = new URLSearchParams(window.location.search).get("tx");
      const [value, events, receipt, walletProfile, walletBalance] = await Promise.all([
        getVerdict(id),
        getVerdictHistory(id),
        tx ? verifyFinalizedTransaction(id, tx) : Promise.resolve(null),
        address ? getProfile(address) : Promise.resolve(null),
        address ? getBalance(address) : Promise.resolve(null),
      ]);
      setResult(value);
      setHistory(events);
      setVerification(receipt);
      setProfile(walletProfile);
      setBalance(walletBalance);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read this finalized result.");
    } finally {
      setLoading(false);
    }
  }, [address, id]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { void load(); });
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const challengeDeadline = Number(result?.challenge_eligible_until ?? 0);
  const challengeRecord = asRecord(result?.challenge);
  const challengeOpen = Boolean(result?.finalized) && !result?.challenged && !challengeRecord.id && now <= challengeDeadline;
  const isParticipant = Boolean(address && participantAddresses(result ?? {}).includes(address.toLowerCase()));
  const canChallenge = challengeOpen && Boolean(address) && Boolean(profile) && !isParticipant && chainId === TARGET_CHAIN_ID && reason.trim().length >= 12 && reason.trim().length <= 600;
  const currentVerdict = asRecord(result?.verdict);
  const originalVerdict = result?.original_verdict;
  const deadlineDate = challengeDeadline > 0 ? new Date(challengeDeadline * 1000).toISOString() : undefined;

  const submitChallenge = async () => {
    if (!address) {
      await connect();
      return;
    }
    if (!profile) {
      setError("Create a player profile before challenging a verdict.");
      return;
    }
    if (!canChallenge) {
      setError("This wallet is not eligible, the wallet is on the wrong chain, or the challenge window is closed.");
      return;
    }
    setChallenging(true);
    setError(null);
    setStatus("Signing the challenge and waiting for finalized independent consensus…");
    setChallengeVerification(null);
    try {
      const write = await challengeVerdict(address, id, reason.trim());
      const verified = await verifyFinalizedChallengeTransaction(id, write.hash);
      setChallengeVerification(verified);
      if (!verified.verified) throw new Error(verified.reason ?? "Finalized challenge evidence could not be verified.");
      setStatus(`Challenge finalized in ${write.hash}. Refreshing authoritative state…`);
      await load();
      const refreshedBalance = await getBalance(address);
      setBalance(refreshedBalance);
      setStatus(`Challenge finalized and verified. Current balance: ${refreshedBalance} Jest Points.`);
      setReason("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Challenge transaction failed.");
      setStatus(null);
    } finally {
      setChallenging(false);
    }
  };

  const challengeExplanation = useMemo(() => {
    if (!address) return "Connect an injected EIP-1193 wallet to challenge this result.";
    if (chainId !== TARGET_CHAIN_ID) return `Switch the injected wallet to Studionet (chain ${TARGET_CHAIN_ID}).`;
    if (isParticipant) return "Participants cannot challenge their own result.";
    if (!profile) return "This wallet needs a player profile before it can challenge.";
    if (!challengeOpen) return "The one-time challenge window is closed or this result was already challenged.";
    return "One independent challenge is permitted per finalized result. The settlement is changed only after substantive consensus.";
  }, [address, chainId, challengeOpen, isParticipant, profile]);

  return (
    <ArenaShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#0057FF]">Permanent result page</p>
          <h1 className="mt-1 font-['Rubik_Mono_One',monospace] text-3xl">Verdict {id.slice(0, 12)}</h1>
          <p className="mt-2 max-w-2xl font-mono text-xs text-[#6B6257]">Public state comes from the finalized Studionet contract. Receipt evidence is displayed only after the browser verifies the target contract, finality, execution result, returned identifier, and authoritative state.</p>
        </div>

        {loading && <p className="font-mono text-sm text-[#6B6257]">Reading finalized state from Studionet…</p>}
        {error && <div role="alert" className="border-2 border-[#FF3B30] bg-[#FFE9E7] p-3 font-mono text-sm">{error}</div>}
        {status && <div role="status" aria-live="polite" className="border-2 border-[#0057FF] bg-[#EAF0FF] p-3 font-mono text-sm">{status}</div>}

        {result && <>
          <div className="flex flex-wrap gap-2">
            <Badge variant={result.finality === "state_finalized" ? "safe" : "chaos"}>{String(result.finality ?? "pending")}</Badge>
            <Badge variant="blue">Independent reassessment</Badge>
            {result.challenged ? <Badge variant="purple">Challenge settled</Badge> : <Badge variant="yellow">Original verdict</Badge>}
          </div>

          <section aria-labelledby="settlement-heading" className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212]">
            <h2 id="settlement-heading" className="mb-2 text-xs font-black uppercase">Submissions, criteria, and settlement</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="font-black uppercase">Current balance deltas</p><p className="font-mono">{String(currentVerdict.actual_delta ?? currentVerdict.actual_a_delta ?? "0")} Jest Points</p></div>
              <div><p className="font-black uppercase">Result status</p><p className="font-mono">{String(result.status ?? "finalized")} · {result.finalized ? "state finalized" : "pending"}</p></div>
              <div><p className="font-black uppercase">Original verdict is immutable</p><p className="font-mono">{originalVerdict ? "preserved" : "not available"}</p></div>
              <div><p className="font-black uppercase">Challenge</p><p className="font-mono">{result.challenged ? "settled" : "not challenged"}</p></div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer font-black uppercase">Show authoritative result payload</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-xs font-mono">{json(result)}</pre>
            </details>
          </section>

          <section aria-labelledby="challenge-heading" className="border-4 border-[#7A35FF] bg-white p-4 shadow-[4px_4px_0px_#121212]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="challenge-heading" className="text-lg font-black uppercase">Verdict challenge</h2>
                <p className="mt-1 max-w-2xl text-sm text-[#6B6257]">Challenge the finalized semantic decision once. Validators independently rejudge the original prompt and submission, then the contract deterministically applies KEEP, ADJUST, or BLOCK.</p>
              </div>
              {challengeDeadline > 0 && <Badge variant={challengeOpen ? "yellow" : "default"}>{challengeOpen ? "window open" : "window closed"}</Badge>}
            </div>
            <p className="mt-3 font-mono text-sm" aria-live="polite">
              {challengeDeadline > 0 ? <>Deadline: <time dateTime={deadlineDate}>{countdown(Math.max(0, challengeDeadline - now))}</time> ({new Date(challengeDeadline * 1000).toLocaleString()})</> : "No challenge deadline recorded."}
            </p>
            <p className="mt-2 text-sm">{challengeExplanation}</p>
            {challengeOpen && !isParticipant && <div className="mt-4 space-y-3">
              <label htmlFor="challenge-reason" className="block text-xs font-black uppercase">Reason for independent reassessment</label>
              <textarea id="challenge-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={12} maxLength={600} rows={4} aria-describedby="challenge-help" className="w-full border-2 border-[#121212] bg-[#FFFDF8] p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-[#0057FF]" placeholder="Explain the substantive safety, winner, relevance, or scoring issue…" />
              <p id="challenge-help" className="text-xs text-[#6B6257]">12–600 characters · {reason.length}/600</p>
              {!address ? <Button type="button" onClick={() => void connect()} aria-label="Connect injected wallet to challenge">Connect wallet</Button> : <Button type="button" onClick={() => void submitChallenge()} disabled={!canChallenge || challenging} aria-busy={challenging} aria-label="Challenge this verdict">{challenging ? "Waiting for finality…" : "Challenge verdict"}</Button>}
            </div>}
            {challengeVerification && <div className="mt-4 border-2 border-[#00A878] bg-[#E9FFF4] p-3 text-sm" role="status"><p className="font-black uppercase">Challenge receipt verified</p><p className="mt-1 break-all font-mono">{challengeVerification.hash}</p><p className="mt-1">Finalized · {challengeVerification.resultName ?? "MAJORITY_AGREE"} · {challengeVerification.executionResult ?? "SUCCESS"}. The authoritative challenge record is bound to this receipt.</p></div>}
          </section>

          {address && <section className="border-2 border-[#00D8C8] bg-[#121212] p-4 text-sm text-[#D8D0BF]">
            <p className="font-black uppercase text-[#00D8C8]">Connected career state</p>
            <p className="mt-1 font-mono">{profile ? `${profile.alias} · ${balance ?? profile.balance ?? 0} Jest Points` : "No finalized profile for this wallet."}</p>
          </section>}

          <section aria-labelledby="history-heading" className="border-2 border-[#7A35FF] bg-white p-4">
            <h2 id="history-heading" className="mb-2 text-xs font-black uppercase">Immutable verdict and challenge history</h2>
            {history.length === 0 ? <p className="font-mono text-sm">No history records returned.</p> : <ol className="space-y-3">{history.map((event, index) => <li key={`${id}-history-${index}`} className="border-l-4 border-[#7A35FF] pl-3"><p className="text-xs font-black uppercase">{String(asRecord(event).phase ?? "record")} · {String(asRecord(event).timestamp ?? "")}</p><pre className="mt-1 whitespace-pre-wrap break-words text-xs font-mono">{json(event)}</pre></li>)}</ol>}
          </section>

          <section className="border-2 border-[#00D8C8] bg-[#121212] p-4 text-xs font-mono text-[#D8D0BF]">
            <p className="mb-1 font-black uppercase text-[#00D8C8]">Receipt relationship</p>
            {verification ? <>{verification.verified ? <p className="text-[#35E36D]">Verified finalized transaction {verification.hash} returns this result and reached successful MAJORITY_AGREE execution.</p> : <p className="text-[#FF8BD1]">Not verified: {verification.reason ?? "receipt relationship could not be proven"}.</p>}</> : <p>No transaction hash is treated as authoritative from contract state alone. Share a finalized write URL in the form /verdict/{id}?tx=0x… to verify it in the browser.</p>}
          </section>
        </>}
      </div>
    </ArenaShell>
  );
}
