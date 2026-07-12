"use client";

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
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
// Burner signer - local private key for devices with no injected wallet
// (mobile Chrome/Safari without a wallet app). Signs locally, never leaves
// the browser. Toy-points app only; not meant to hold anything of value.
// ---------------------------------------------------------------------------
const BURNER_KEY_STORAGE_KEY = "jestor_burner_pk";

export function getBurnerPrivateKey(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BURNER_KEY_STORAGE_KEY) as `0x${string}` | null;
}

export function getOrCreateBurnerPrivateKey(): `0x${string}` {
  if (typeof window === "undefined") {
    throw new Error("Burner wallet can only be used in the browser.");
  }
  const existing = getBurnerPrivateKey();
  if (existing) return existing;
  const key = generatePrivateKey();
  window.localStorage.setItem(BURNER_KEY_STORAGE_KEY, key);
  return key;
}

export function getBurnerAddress(): `0x${string}` {
  return createAccount(getOrCreateBurnerPrivateKey()).address;
}

// ---------------------------------------------------------------------------
// Write client - uses window.ethereum when available (MetaMask signs the tx),
// otherwise falls back to the local burner signer.
// ---------------------------------------------------------------------------
export async function getWriteClient() {
  if (typeof window === "undefined") {
    throw new Error("Write client can only be used in the browser.");
  }

  if (!window.ethereum) {
    const account = createAccount(getOrCreateBurnerPrivateKey());
    return createClient({ chain: studionet, account });
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
