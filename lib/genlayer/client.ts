"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CONTRACT === "true";
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999");
export const TARGET_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL ?? "https://studio.genlayer.com/api";

let readClient: ReturnType<typeof createClient> | null = null;
export function getReadClient() {
  if (!readClient) readClient = createClient({ chain: studionet });
  return readClient;
}
export const getGenLayerClient = getReadClient;

/** Writes are signed exclusively by an injected EIP-1193 provider. */
export async function getWriteClient() {
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
  const resultName = receipt?.resultName ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" } as Record<number, string>)[receipt?.result];
  return {
    statusName,
    resultName,
    executionResult,
    finality: statusName === "FINALIZED" ? "finalized" : statusName === "ACCEPTED" ? "accepted" : "unknown",
    consensusData: receipt?.consensus_data,
    stderr: leader?.genvm_result?.stderr ?? leader?.stderr ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractReturnValueFromReceipt(receipt: any): unknown | null {
  const leader = receipt?.consensus_data?.leader_receipt?.[0];
  if (!leader || (leader.execution_result && leader.execution_result !== "SUCCESS")) return null;
  if (leader.result !== undefined && leader.result !== null && leader.result !== "") return leader.result;
  return null;
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
