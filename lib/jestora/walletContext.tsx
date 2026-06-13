"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
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

const WalletContext = createContext<WalletState>({
  address: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

const TARGET_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999");

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No injected wallet found. Install MetaMask.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainHex = await window.ethereum.request({ method: "eth_chainId" });
      setAddress((accounts as string[])[0]);
      setChainId(parseInt(chainHex as string, 16));
    } catch (e: unknown) {
      setError((e as Error).message ?? "Connection rejected.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setError(null);
  }, []);

  // Restore session on mount without prompting — MetaMask already has permission
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    (window.ethereum.request({ method: "eth_accounts" }) as Promise<string[]>)
      .then((accounts) => {
        if (accounts[0]) {
          setAddress(accounts[0]);
          (window.ethereum!.request({ method: "eth_chainId" }) as Promise<string>)
            .then((hex) => setChainId(parseInt(hex, 16)))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const onAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      setAddress(accs[0] ?? null);
    };
    const onChainChanged = (chain: unknown) => {
      setChainId(parseInt(chain as string, 16));
    };
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum?.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        chainId,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

export { shortAddress };
