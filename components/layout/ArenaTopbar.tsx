"use client";

import { useWallet, TARGET_CHAIN_ID } from "@/lib/jestora/walletContext";
import { shortAddress } from "@/lib/jestora/format";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { ARENA_NAV_ITEMS, isArenaNavItemActive } from "./arenaNavigation";

type EthereumProvider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export default function ArenaTopbar() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const pathname = usePathname();
  const targetChain = TARGET_CHAIN_ID;
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
      <div className="mx-auto max-w-7xl flex items-center justify-between px-3 sm:px-4 py-1.5 gap-2 overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 min-w-0">
          <span className="font-['Rubik_Mono_One',monospace] text-base sm:text-lg text-[#121212] tracking-tight truncate">
            JESTOR
          </span>
          <span className="hidden sm:inline text-[10px] font-black uppercase bg-[#121212] text-[#FFE600] px-1 py-0.5 tracking-widest">
            ARENA
          </span>
        </Link>

        {/* Nav */}
        <nav aria-label="Primary navigation" className="hidden xl:flex min-w-0 flex-1 items-center justify-center gap-0.5 text-[10px] font-black uppercase tracking-wide whitespace-nowrap">
          {ARENA_NAV_ITEMS.map(({ href, label }) => {
            const active = isArenaNavItemActive(pathname, href);
            return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex-none border px-1.5 py-1 transition-colors ${
                active
                  ? "border-[#121212] bg-[#121212] text-[#FFE600]"
                  : "border-transparent hover:border-[#121212] hover:bg-[#121212] hover:text-[#FFE600]"
              }`}
            >
              {label}
            </Link>
            );
          })}
        </nav>

        {/* Mobile nav toggle */}
        <button
          type="button"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          aria-controls="arena-mobile-navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
          className="xl:hidden shrink-0 border-2 border-[#121212] bg-[#FFE600] p-1.5 shadow-[2px_2px_0px_#121212] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Wallet */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          {isConnected && (
            <>
              {!onCorrectChain && (
                <button
                  onClick={switchToStudionet}
                  className="text-[10px] sm:text-xs font-black uppercase bg-[#FF3B30] text-white border-2 border-[#121212] px-1.5 sm:px-2 py-0.5 shadow-[2px_2px_0px_#121212] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Wrong Chain - Switch</span>
                  <span className="sm:hidden">Switch</span>
                </button>
              )}
              {onCorrectChain && (
                <Badge variant="safe" className="hidden sm:inline-block">
                  <Zap className="inline w-3 h-3 mr-1" />
                  GL Ready
                </Badge>
              )}
              <span className="text-[10px] sm:text-xs font-mono bg-[#121212] text-[#FFE600] px-1.5 sm:px-2 py-1 border border-[#121212] whitespace-nowrap">
                {shortAddress(address!)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                aria-label="Disconnect wallet"
                title="Disconnect wallet"
                className="!h-8 !w-8 !p-0 !text-[10px]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Disconnect</span>
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
        <nav id="arena-mobile-navigation" aria-label="Mobile navigation" className="xl:hidden flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-t-2 border-[#121212] bg-[#FFE600] text-xs font-black uppercase tracking-wider">
          {ARENA_NAV_ITEMS.map(({ href, label }) => {
            const active = isArenaNavItemActive(pathname, href);
            return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileNavOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`border-b border-[#121212]/20 px-4 py-3 transition-colors ${
                active
                  ? "bg-[#121212] text-[#FFE600]"
                  : "hover:bg-[#121212] hover:text-[#FFE600]"
              }`}
            >
              {label}
            </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
