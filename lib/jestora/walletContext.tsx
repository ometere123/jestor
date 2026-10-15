"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { TARGET_CHAIN_ID } from "@/lib/genlayer/client";
import { shortAddress } from "./format";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({ address: null, isConnected: false, isConnecting: false, chainId: null, error: null, connect: async () => {}, disconnect: () => {} });

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No injected EIP-1193 wallet found. Install a wallet or use a wallet browser.");
      return;
    }
    setIsConnecting(true); setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const hex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      setAddress(accounts?.[0] ?? null); setChainId(parseInt(hex, 16));
    } catch (e: unknown) {
      setError((e as Error).message ?? "Wallet connection rejected.");
    } finally { setIsConnecting(false); }
  }, []);

  const disconnect = useCallback(() => { setAddress(null); setChainId(null); setError(null); }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    void window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      const list = accounts as string[];
      if (list?.[0]) setAddress(list[0]);
    }).catch(() => {});
    void window.ethereum.request({ method: "eth_chainId" }).then((hex) => setChainId(parseInt(hex as string, 16))).catch(() => {});
    const onAccountsChanged = (accounts: unknown) => setAddress((accounts as string[])[0] ?? null);
    const onChainChanged = (hex: unknown) => setChainId(parseInt(hex as string, 16));
    window.ethereum.on("accountsChanged", onAccountsChanged); window.ethereum.on("chainChanged", onChainChanged);
    return () => { window.ethereum?.removeListener("accountsChanged", onAccountsChanged); window.ethereum?.removeListener("chainChanged", onChainChanged); };
  }, []);

  return <WalletContext.Provider value={{ address, isConnected: !!address, isConnecting, chainId, error, connect, disconnect }}>{children}</WalletContext.Provider>;
}

export function useWallet() { return useContext(WalletContext); }
export { shortAddress, TARGET_CHAIN_ID };
