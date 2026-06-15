"use client";

import { useWallet } from "@/lib/jestora/walletContext";
import { shortAddress } from "@/lib/jestora/format";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function ArenaTopbar() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWallet();
  const targetChain = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999");
  const onCorrectChain = chainId === targetChain;

  const switchToStudionet = async () => {
    if (!window.ethereum) return;
    const chainHex = `0x${targetChain.toString(16)}`;
    try {
      await (window.ethereum as any).request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainHex }],
      });
    } catch (err: any) {
      // Chain not added yet, add it
      if (err.code === 4902) {
        await (window.ethereum as any).request({
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
          {[
            ["/arena", "Dashboard"],
            ["/caption-rift", "Caption Rift"],
            ["/roast", "Roast"],
            ["/duels", "Duels"],
            ["/chaos-lab", "Chaos Lab"],
            ["/leaderboard", "Scores"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="px-2 py-1 hover:bg-[#121212] hover:text-[#FFE600] transition-colors border border-transparent hover:border-[#121212]"
            >
              {label}
            </Link>
          ))}
        </nav>

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
    </header>
  );
}
