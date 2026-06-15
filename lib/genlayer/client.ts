"use client";

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_CONTRACT === "true";

// ---------------------------------------------------------------------------
// Read client - ephemeral account, no signing needed
// ---------------------------------------------------------------------------
let _readClient: ReturnType<typeof createClient> | null = null;

export function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({
      chain: studionet,
      account: createAccount(),
    });
  }
  return _readClient;
}

// Alias kept for existing imports
export const getGenLayerClient = getReadClient;

// ---------------------------------------------------------------------------
// Write client - uses window.ethereum so MetaMask signs the tx
// ---------------------------------------------------------------------------
export async function getWriteClient() {
  if (typeof window === "undefined") {
    throw new Error("Write client can only be used in the browser.");
  }
  if (!window.ethereum) {
    throw new Error("No wallet provider found. Please install MetaMask.");
  }
  // Request the currently connected account - MetaMask returns [] if not connected
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = await (window.ethereum as any).request({ method: "eth_accounts" }) as string[];
  const account = accounts?.[0];
  if (!account) {
    // Try to prompt connection if accounts not yet granted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requested = await (window.ethereum as any).request({ method: "eth_requestAccounts" }) as string[];
    const addr = requested?.[0];
    if (!addr) throw new Error("No MetaMask account connected. Please connect your wallet first.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createClient({ chain: studionet, provider: window.ethereum as any, account: addr as `0x${string}` });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient({ chain: studionet, provider: window.ethereum as any, account: account as `0x${string}` });
}

// ---------------------------------------------------------------------------
// Contract address
// ---------------------------------------------------------------------------
export function getContractAddress(): `0x${string}` | null {
  const addr = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
  if (!addr) return null;
  return addr as `0x${string}`;
}
