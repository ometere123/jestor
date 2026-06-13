"use client";

import { getReadClient, getWriteClient, getContractAddress, USE_MOCK } from "./client";
import { mockContract } from "../jestora/mockContract";
import type {
  PlayerProfile,
  Submission,
  Duel,
  Prompt,
  ChaosEvent,
  LeaderboardEntry,
  ProtocolStats,
} from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Arg = any;

export interface WriteResult {
  hash: string;
  verdict: Record<string, unknown> | null;
  returnValue: unknown | null;
}

// ---------------------------------------------------------------------------
// Verdict extraction — parse from leader_receipt eq_outputs (non-det result)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractReturnValueFromReceipt(receipt: any): unknown | null {
  try {
    const lr = receipt?.consensus_data?.leader_receipt?.[0];
    if (!lr) return null;
    // Deterministic return values come in lr.result
    if (lr.result !== undefined && lr.result !== null && lr.result !== "") return lr.result;
    // Also check eq_outputs for scalar values
    const eq = lr.eq_outputs;
    if (eq && typeof eq === "object") {
      for (const v of Object.values(eq)) {
        if (typeof v === "string" || typeof v === "number") return v;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractVerdictFromReceipt(receipt: any): Record<string, unknown> | null {
  try {
    const lr = receipt?.consensus_data?.leader_receipt?.[0];
    if (!lr) return null;

    const eq = lr.eq_outputs;
    console.debug("[verdict] eq_outputs:", JSON.stringify(eq));

    if (eq && typeof eq === "object") {
      for (const v of Object.values(eq)) {
        // Already a parsed object
        if (v && typeof v === "object" && !Array.isArray(v)) {
          return v as Record<string, unknown>;
        }
        // String — try JSON.parse, also try fixing missing commas
        if (typeof v === "string") {
          const attempts = [
            v,
            // GenLayer Studio display strips commas between values — add them back
            v.replace(/("|\d|true|false|null)"/g, '$1,"'),
            v.replace(/("|\d|true|false|null)(\s*")/g, '$1,$2'),
          ];
          for (const attempt of attempts) {
            try {
              const parsed = JSON.parse(attempt);
              if (parsed && typeof parsed === "object") return parsed;
            } catch { /* keep trying */ }
          }
          console.debug("[verdict] failed to parse eq string:", v);
        }
      }
    }

    // Fallback: result field
    if (typeof lr.result === "string" && lr.result.startsWith("{")) {
      try { return JSON.parse(lr.result); } catch { /* ignore */ }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Read helper
// ---------------------------------------------------------------------------
async function callRead(method: string, args: Arg[] = []): Promise<unknown> {
  if (USE_MOCK) return mockContract.read(method, args);
  const client = getReadClient();
  const address = getContractAddress();
  if (!address) throw new Error("Contract address not set. Check NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS.");
  return client.readContract({
    address,
    functionName: method,
    args,
  });
}

// ---------------------------------------------------------------------------
// Write helper — signs with MetaMask, waits for consensus, extracts verdict
// ---------------------------------------------------------------------------
async function callWrite(
  _senderAddress: string,
  method: string,
  args: Arg[] = []
): Promise<WriteResult> {
  if (USE_MOCK) {
    const hash = await mockContract.write(method, args, _senderAddress);
    return { hash, verdict: null, returnValue: null };
  }

  const writeClient = await getWriteClient();
  const readClient = getReadClient();
  const address = getContractAddress();
  if (!address) throw new Error("Contract address not set.");

  const hash = await writeClient.writeContract({
    address,
    functionName: method,
    args,
    value: BigInt(0),
  });

  // Use the read client (GenLayer-native account) to wait for the receipt —
  // it returns the full GenLayer receipt including consensus_data + eq_outputs.
  // The MetaMask write client returns a standard ETH receipt without those fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipt = await readClient.waitForTransactionReceipt({
    hash: hash as any,
    retries: 60,
    interval: 5000,
  });

  const verdict = extractVerdictFromReceipt(receipt);
  const returnValue = extractReturnValueFromReceipt(receipt);
  return { hash: hash as string, verdict, returnValue };
}

// ---------------------------------------------------------------------------
// Write methods
// ---------------------------------------------------------------------------
export async function createProfile(sender: string, alias: string): Promise<WriteResult> {
  return callWrite(sender, "create_profile", [alias]);
}

export async function submitCaption(sender: string, roundId: string, caption: string): Promise<WriteResult> {
  return callWrite(sender, "submit_caption", [roundId, caption]);
}

export async function submitRoastSelf(sender: string, text: string): Promise<WriteResult> {
  return callWrite(sender, "submit_roast_self", [text]);
}

export async function invokeChaosAction(sender: string, actionText: string): Promise<WriteResult> {
  return callWrite(sender, "invoke_chaos_action", [actionText]);
}

export async function startDuel(sender: string, promptId: string, entry: string): Promise<WriteResult> {
  return callWrite(sender, "start_duel", [promptId, entry]);
}

export async function joinDuel(sender: string, duelId: string, entry: string): Promise<WriteResult> {
  return callWrite(sender, "join_duel", [duelId, entry]);
}

export async function resolveDuel(sender: string, duelId: string): Promise<WriteResult> {
  return callWrite(sender, "resolve_duel", [duelId]);
}

export async function createPrompt(sender: string, promptText: string): Promise<WriteResult> {
  return callWrite(sender, "create_prompt", [promptText]);
}

// ---------------------------------------------------------------------------
// View methods
// ---------------------------------------------------------------------------
export async function getProfile(address: string): Promise<PlayerProfile | null> {
  // Try checksummed first, then lowercase — contract stores via str(gl.message.sender_address)
  // which may be lowercase depending on the GenLayer runtime version.
  for (const addr of [address, address.toLowerCase()]) {
    const result = await callRead("get_profile", [addr]);
    if (result && Object.keys(result as object).length > 0) return result as PlayerProfile;
  }
  return null;
}

export async function getBalance(address: string): Promise<number> {
  const result = await callRead("get_balance", [address.toLowerCase()]);
  return Number(result ?? 0);
}

export async function getSubmission(submissionId: string): Promise<Submission | null> {
  const result = await callRead("get_submission", [submissionId]);
  if (!result || Object.keys(result as object).length === 0) return null;
  return result as Submission;
}

export async function getLatestDuelId(address: string): Promise<string | null> {
  const result = await callRead("get_latest_duel_id", [address.toLowerCase()]);
  return (typeof result === "string" && result.length > 0) ? result : null;
}

export async function getDuel(duelId: string): Promise<Duel | null> {
  const result = await callRead("get_duel", [duelId]);
  if (!result || Object.keys(result as object).length === 0) return null;
  return result as Duel;
}

export async function getActivePrompts(): Promise<Prompt[]> {
  const result = await callRead("get_active_prompts", []);
  return (result as Prompt[]) ?? [];
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const result = await callRead("get_leaderboard", []);
  return (result as LeaderboardEntry[]) ?? [];
}

export async function getChaosFeed(limit = 20): Promise<ChaosEvent[]> {
  const result = await callRead("get_chaos_feed", [limit]);
  return (result as ChaosEvent[]) ?? [];
}

export async function getProtocolStats(): Promise<ProtocolStats> {
  const result = await callRead("get_protocol_stats", []);
  return (result as ProtocolStats) ?? {
    total_submissions: 0,
    total_duels: 0,
    total_chaos_actions: 0,
    total_profiles: 0,
  };
}
