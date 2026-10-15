"use client";

import type { CalldataEncodable } from "genlayer-js/types";
import { sha256, toBytes } from "viem";
import { getContractAddress, getReadClient, getWriteClient, USE_MOCK, extractVerdictFromReceipt, extractReturnValueFromReceipt, receiptEvidence, type ReceiptEvidence } from "./client";
import { mockContract } from "../jestora/mockContract";
import type { Career, ChaosEvent, Duel, LeaderboardEntry, PlayerProfile, Prompt, ProtocolStats, Submission, Tournament } from "./types";

type Arg = CalldataEncodable;

export interface WriteResult {
  hash: string;
  verdict: Record<string, unknown> | null;
  rawVerdict: unknown | null;
  returnValue: unknown | null;
  evidence: ReceiptEvidence;
  resultId?: string;
}

async function callRead(method: string, args: Arg[] = []): Promise<unknown> {
  if (USE_MOCK) return mockContract.read(method, args);
  const client = getReadClient();
  const address = getContractAddress();
  if (!address) throw new Error("Contract address is not configured.");
  return client.readContract({ address, functionName: method, args });
}

async function callWrite(sender: string, method: string, args: Arg[] = []): Promise<WriteResult> {
  if (USE_MOCK) {
    const hash = await mockContract.write(method, args, sender);
    return { hash, verdict: null, rawVerdict: null, returnValue: null, evidence: { finality: "finalized", executionResult: "SUCCESS" } };
  }
  const writeClient = await getWriteClient();
  const connected = String(writeClient.account?.address ?? "").toLowerCase();
  if (connected !== sender.toLowerCase()) throw new Error("Connected wallet changed. Reconnect and retry.");
  const address = getContractAddress();
  if (!address) throw new Error("Contract address is not configured.");
  const hash = await writeClient.writeContract({ address, functionName: method, args, value: BigInt(0) });
  const readClient = getReadClient();
  // FINALIZED is required; ACCEPTED is not enough evidence that state settled.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipt = await (readClient.waitForTransactionReceipt as any)({ hash, status: "FINALIZED", retries: 180, interval: 5000, fullTransaction: true });
  const evidence = receiptEvidence(receipt);
  if (evidence.executionResult === "ERROR" || evidence.executionResult === "FINISHED_WITH_ERROR") throw new Error(evidence.stderr || `Contract execution failed for ${hash}.`);
  if (evidence.resultName === "MAJORITY_DISAGREE") throw new Error(`Independent validators did not reach majority agreement for ${hash}.`);
  const returnValue = extractReturnValueFromReceipt(receipt);
  return { hash: String(hash), verdict: extractVerdictFromReceipt(receipt), rawVerdict: receipt?.consensus_data?.leader_receipt?.[0]?.eq_outputs ?? null, returnValue, resultId: typeof returnValue === "string" && returnValue ? returnValue : undefined, evidence };
}

export async function createProfile(sender: string, alias: string) { return callWrite(sender, "create_profile", [alias]); }
export async function createPrompt(sender: string, text: string) { return callWrite(sender, "create_prompt", [text]); }
export async function submitCaption(sender: string, promptId: string, caption: string) { return callWrite(sender, "submit_caption", [promptId, caption]); }
export async function submitRoastSelf(sender: string, promptId: string, text: string) { return callWrite(sender, "submit_roast_self", [promptId, text]); }
export async function invokeChaosAction(sender: string, promptId: string, text: string) { return callWrite(sender, "invoke_chaos_action", [promptId, text]); }
export async function submitRemix(sender: string, promptId: string, sourceId: string, text: string) { return callWrite(sender, "submit_remix", [promptId, sourceId, text]); }

function randomSalt(): string {
  if (typeof window === "undefined") throw new Error("Duel commits require a browser wallet.");
  const bytes = new Uint8Array(24); crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function duelCommitment(promptId: string, address: string, entry: string, salt: string): string {
  return sha256(toBytes(`JESTOR-DUEL-V1|${promptId}|${address.toLowerCase()}|${salt}|${entry.trim()}`)).slice(2);
}

export async function startDuel(sender: string, promptId: string, entry: string): Promise<WriteResult> {
  // The first transaction contains only the salted, domain-separated commitment.
  // The reveal is a separate finalized transaction and is the only point where
  // the entry becomes readable to the contract.
  const salt = randomSalt();
  const commitment = duelCommitment(promptId, sender, entry, salt);
  const start = await callWrite(sender, "start_duel", [promptId, commitment]);
  const duelId = await getLatestDuelId(sender);
  if (!duelId) return start;
  const reveal = await callWrite(sender, "reveal_duel_entry", [duelId, entry, salt]);
  return { ...reveal, resultId: duelId };
}

export async function joinDuel(sender: string, duelId: string, entry: string): Promise<WriteResult> {
  const duel = await getDuel(duelId);
  if (!duel) throw new Error("Duel not found.");
  const salt = randomSalt();
  const commitment = duelCommitment(duel.prompt_id, sender, entry, salt);
  await callWrite(sender, "join_duel", [duelId, commitment]);
  const reveal = await callWrite(sender, "reveal_duel_entry", [duelId, entry, salt]);
  return { ...reveal, resultId: duelId };
}

export async function resolveDuel(sender: string, duelId: string) { return callWrite(sender, "resolve_duel", [duelId]); }
export async function cancelDuel(sender: string, duelId: string) { return callWrite(sender, "cancel_duel", [duelId]); }
export async function challengeVerdict(sender: string, resultId: string, text: string) { return callWrite(sender, "challenge_verdict", [resultId, text]); }
export async function recordTransactionHash(sender: string, resultId: string, hash: string) { return callWrite(sender, "record_transaction_hash", [resultId, hash]); }
export async function createTournament(sender: string, promptId: string, startsAt: number) { return callWrite(sender, "create_tournament", [promptId, startsAt]); }
export async function joinTournament(sender: string, tournamentId: string, entry: string) { return callWrite(sender, "join_tournament", [tournamentId, entry]); }
export async function settleTournamentMatch(sender: string, tournamentId: string, matchIndex: number) { return callWrite(sender, "settle_tournament_match", [tournamentId, matchIndex]); }

export async function getProfile(address: string): Promise<PlayerProfile | null> {
  const result = await callRead("get_profile", [address.toLowerCase()]);
  return result && Object.keys(result as object).length ? result as PlayerProfile : null;
}
export async function getBalance(address: string): Promise<number> { return Number(await callRead("get_balance", [address.toLowerCase()]) ?? 0); }
export async function getSubmission(id: string): Promise<Submission | null> { const result = await callRead("get_submission", [id]); return result && Object.keys(result as object).length ? result as Submission : null; }
export async function getRecentSubmissions(promptId: string, limit = 20): Promise<Submission[]> { return (await callRead("get_recent_submissions", [promptId, limit])) as Submission[] ?? []; }
export async function getDuel(id: string): Promise<Duel | null> { const result = await callRead("get_duel", [id]); return result && Object.keys(result as object).length ? result as Duel : null; }
export async function getLatestDuelId(address: string): Promise<string | null> { const result = await callRead("get_latest_duel_id", [address.toLowerCase()]); return typeof result === "string" && result ? result : null; }
export async function getLatestSubmissionId(address: string): Promise<string | null> { const result = await callRead("get_latest_submission_id", [address.toLowerCase()]); return typeof result === "string" && result ? result : null; }
export async function getOpenDuels(): Promise<Duel[]> { return (await callRead("get_open_duels")) as Duel[] ?? []; }
export async function getAllDuels(): Promise<Duel[]> { return (await callRead("get_all_duels")) as Duel[] ?? []; }
export async function getActivePrompts(): Promise<Prompt[]> { return (await callRead("get_active_prompts")) as Prompt[] ?? []; }
export async function getPrompt(id: string): Promise<Prompt | null> { const result = await callRead("get_prompt", [id]); return result && Object.keys(result as object).length ? result as Prompt : null; }
export async function getLeaderboard(): Promise<LeaderboardEntry[]> { return (await callRead("get_leaderboard")) as LeaderboardEntry[] ?? []; }
export async function getChaosFeed(limit = 20): Promise<ChaosEvent[]> { return (await callRead("get_chaos_feed", [limit])) as ChaosEvent[] ?? []; }
export async function getProtocolStats(): Promise<ProtocolStats> { return (await callRead("get_protocol_stats")) as ProtocolStats; }
export async function getVerdict(id: string): Promise<Record<string, unknown> | null> { const result = await callRead("get_verdict", [id]); return result && Object.keys(result as object).length ? result as Record<string, unknown> : null; }
export async function getVerdictHistory(id: string, limit = 10) { return (await callRead("get_verdict_history", [id, limit])) as unknown[] ?? []; }
export async function getCareer(address: string): Promise<Career | null> { const result = await callRead("get_career", [address.toLowerCase()]); return result && Object.keys(result as object).length ? result as Career : null; }
export async function getSeasonStandings(season: string, limit = 50) { return (await callRead("get_season_standings", [season, limit])) as unknown[] ?? []; }
export async function getOpenTournaments(): Promise<Tournament[]> { return (await callRead("get_open_tournaments")) as Tournament[] ?? []; }
