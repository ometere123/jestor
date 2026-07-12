"use client";

import { useWallet } from "@/lib/jestora/walletContext";
import { shortAddress } from "@/lib/jestora/format";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";

type EthereumProvider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const NAV_LINKS: [string, string][] = [
  ["/arena", "Dashboard"],
  ["/caption-rift", "Caption Rift"],
  ["/roast", "Roast"],
  ["/duels", "Duels"],
  ["/chaos-lab", "Chaos Lab"],
  ["/leaderboard", "Scores"],
  ["/rules", "Rules"],
];

export default function ArenaTopbar() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const targetChain = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999");
  const onCorrectChain = chainId === targetChain;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const switchToStudionet = async () => {
    if (!window.ethereum) return;
    const provider = window.ethereum as EthereumProvider;
    const chainHex = `0x${targetChain.toString(16)}`;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
    } catch (err: unknown) {
      // Chain not added yet, add it
      if (typeof err === "object" && err !== null && "code" in err && err.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: chainHex,
            chainName: "GenLayer Studionet",
            rpcUrls: ["https://studio.genlayer.com/api"],
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          }],
        });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b-4 border-[#121212] bg-[#FFE600] shadow-[0_4px_0px_#121212]">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-2 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-['Rubik_Mono_One',monospace] text-xl text-[#121212] tracking-tight">
            JESTOR
          </span>
          <span className="hidden sm:inline text-xs font-black uppercase bg-[#121212] text-[#FFE600] px-1.5 py-0.5 tracking-widest">
            ARENA
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-black uppercase tracking-wider">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="px-2 py-1 hover:bg-[#121212] hover:text-[#FFE600] transition-colors border border-transparent hover:border-[#121212]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav toggle */}
        <button
          type="button"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileNavOpen((open) => !open)}
          className="md:hidden shrink-0 border-2 border-[#121212] bg-[#FFE600] p-1.5 shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Wallet */}
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && (
            <>
              {!onCorrectChain && (
                <button
                  onClick={switchToStudionet}
                  className="text-xs font-black uppercase bg-[#FF3B30] text-white border-2 border-[#121212] px-2 py-0.5 shadow-[2px_2px_0px_#121212] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  Wrong Chain - Switch
                </button>
              )}
              {onCorrectChain && (
                <Badge variant="safe">
                  <Zap className="inline w-3 h-3 mr-1" />
                  GL Ready
                </Badge>
              )}
              <span className="text-xs font-mono bg-[#121212] text-[#FFE600] px-2 py-1 border border-[#121212]">
                {shortAddress(address!)}
              </span>
              <Button variant="ghost" size="sm" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          )}
          {!isConnected && (
            <Button size="sm" onClick={connect} disabled={isConnecting}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileNavOpen && (
        <nav className="md:hidden flex flex-col border-t-2 border-[#121212] bg-[#FFE600] text-xs font-black uppercase tracking-wider">
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              className="px-4 py-3 border-b border-[#121212]/20 hover:bg-[#121212] hover:text-[#FFE600] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
