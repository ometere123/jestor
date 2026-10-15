"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CONTRACT === "true";
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999");
export const TARGET_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";

function assertStudionetConfiguration(): void {
  if (TARGET_CHAIN_ID !== 61999 || TARGET_RPC_URL !== "https://studio.genlayer.com/api") {
    throw new Error("Jestor requires Studionet chain 61999 at https://studio.genlayer.com/api.");
  }
}

let readClient: ReturnType<typeof createClient> | null = null;
export function getReadClient() {
  assertStudionetConfiguration();
  if (!readClient) readClient = createClient({ chain: studionet });
  return readClient;
}
export const getGenLayerClient = getReadClient;

/** Writes are signed exclusively by an injected EIP-1193 provider. */
export async function getWriteClient() {
  assertStudionetConfiguration();
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected EIP-1193 wallet found. Install a wallet or use a wallet browser.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
  const address = accounts?.[0];
  if (!address) throw new Error("No wallet account connected.");
  const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
  if (parseInt(chainId, 16) !== TARGET_CHAIN_ID) {
    throw new Error(`Wrong chain. Switch the injected wallet to Studionet (chain ${TARGET_CHAIN_ID}).`);
  }
  return createClient({ chain: studionet, provider: window.ethereum, account: address as `0x${string}` });
}

export function getContractAddress(): `0x${string}` | null {
  const address = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
  return address ? address as `0x${string}` : null;
}

export interface ReceiptEvidence {
  statusName?: string;
  resultName?: string;
  executionResult?: string;
  finality: "finalized" | "accepted" | "unknown";
  consensusData?: unknown;
  stderr?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function receiptEvidence(receipt: any): ReceiptEvidence {
  const leader = receipt?.consensus_data?.leader_receipt?.[0];
  const executionResult = leader?.execution_result ?? receipt?.execution_result ?? receipt?.txExecutionResultName;
  const statusName = receipt?.statusName ?? receipt?.status_name ?? (receipt?.status === 7 ? "FINALIZED" : receipt?.status === 5 ? "ACCEPTED" : undefined);
  const resultName = receipt?.resultName ?? receipt?.result_name ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" } as Record<number, string>)[receipt?.result];
  const consensus = receipt?.consensus_data ?? {};
  const validatorReceipts = consensus.validator_receipts ?? consensus.votes ?? consensus.validators;
  return {
    statusName,
    resultName,
    executionResult,
    finality: statusName === "FINALIZED" ? "finalized" : statusName === "ACCEPTED" ? "accepted" : "unknown",
    consensusData: {
      validatorCount: Array.isArray(validatorReceipts) ? validatorReceipts.length : undefined,
      leaderReceiptPresent: Boolean(leader),
      raw: receipt?.consensus_data,
    },
    stderr: leader?.genvm_result?.stderr ?? leader?.stderr ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractReturnValueFromReceipt(receipt: any): unknown | null {
  const leader = receipt?.consensus_data?.leader_receipt?.[0];
  if (!leader || (leader.execution_result && leader.execution_result !== "SUCCESS")) return null;
  const normalize = (candidate: unknown): unknown | null => {
    if (candidate === undefined || candidate === null || candidate === "") return null;
    if (typeof candidate === "string") {
      try { return JSON.parse(candidate); } catch { return candidate; }
    }
    if (typeof candidate === "object") {
      const value = candidate as { readable?: unknown; payload?: unknown };
      if (value.readable !== undefined) return normalize(value.readable);
      if (value.payload !== undefined) return normalize(value.payload);
    }
    return null;
  };
  const candidates = [
    leader.result?.payload?.readable,
    leader.return_value,
    leader.genvm_result?.result?.payload?.readable,
    leader.genvm_result?.result?.readable,
    leader.genvm_result?.return_value,
    receipt?.returnValue,
  ];
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (normalized !== null) return normalized;
  }
  return null;
}

export interface VerifiedTransaction {
  verified: boolean;
  hash: string;
  statusName?: string;
  resultName?: string;
  executionResult?: string;
  resultId?: string;
  reason?: string;
}

function sameAddress(value: unknown, address: string): boolean {
  return typeof value === "string" && value.toLowerCase() === address.toLowerCase();
}

/** Verify a result-to-receipt relationship; arbitrary user supplied hashes are never accepted. */
export async function verifyFinalizedTransaction(resultId: string, hash: string): Promise<VerifiedTransaction> {
  if (USE_MOCK) return { verified: false, hash, reason: "Mock mode has no authoritative receipt." };
  const address = getContractAddress();
  if (!address || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return { verified: false, hash, reason: "A valid transaction hash and configured contract are required." };
  }
  const client = getReadClient();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receipt = await (client.waitForTransactionReceipt as any)({
      hash,
      status: "FINALIZED",
      retries: 2,
      interval: 1500,
    });
    const evidence = receiptEvidence(receipt);
    if (evidence.finality !== "finalized" || evidence.resultName !== "MAJORITY_AGREE" || evidence.executionResult !== "SUCCESS") {
      return { verified: false, hash, statusName: evidence.statusName, resultName: evidence.resultName, executionResult: evidence.executionResult, reason: "Receipt is not a finalized successful majority-agree contract execution." };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transaction: any = await (client.getTransaction as any)({ hash });
    const target = transaction?.to ?? transaction?.to_address ?? transaction?.contract_address ?? transaction?.contractAddress ?? transaction?.target;
    if (!target || !sameAddress(target, address)) {
      return { verified: false, hash, statusName: evidence.statusName, resultName: evidence.resultName, executionResult: evidence.executionResult, reason: "Receipt targets a different contract." };
    }
    const returned = extractReturnValueFromReceipt(receipt);
    const returnedId = typeof returned === "string" ? returned : undefined;
    if (returnedId !== resultId) {
      return { verified: false, hash, statusName: evidence.statusName, resultName: evidence.resultName, executionResult: evidence.executionResult, reason: "The finalized receipt does not return the requested result identifier." };
    }
    return { verified: true, hash, statusName: evidence.statusName, resultName: evidence.resultName, executionResult: evidence.executionResult, resultId: returnedId };
  } catch (error) {
    return { verified: false, hash, reason: error instanceof Error ? error.message : "Receipt verification failed." };
  }
}

function repairLooseJson(raw: string): string {
  return raw.trim().replace(/,\s*([}\]])/g, "$1");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractVerdictFromReceipt(receipt: any): Record<string, unknown> | null {
  try {
    const leader = receipt?.consensus_data?.leader_receipt?.[0];
    const eq = leader?.eq_outputs;
    if (eq && typeof eq === "object") {
      for (const value of Object.values(eq)) {
        if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
        if (typeof value === "string") {
          for (const candidate of [value, repairLooseJson(value)]) {
            try {
              const parsed = JSON.parse(candidate);
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
            } catch { /* try next representation */ }
          }
        }
      }
    }
    if (typeof leader?.result === "string" && leader.result.startsWith("{")) return JSON.parse(leader.result) as Record<string, unknown>;
  } catch { /* authoritative state read remains the fallback */ }
  return null;
}
