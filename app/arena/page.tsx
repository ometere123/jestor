"use client";

import { useState, useEffect } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import JestBalanceCard from "@/components/arena/JestBalanceCard";
import LatestVerdictCard from "@/components/arena/LatestVerdictCard";
import ActivePromptCard from "@/components/arena/ActivePromptCard";
import ChaosFeed from "@/components/arena/ChaosFeed";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useWallet } from "@/lib/jestora/walletContext";
import { getProfile, createProfile, getChaosFeed, getActivePrompts, getProtocolStats } from "@/lib/genlayer/contract";
import { getLastVerdict } from "@/lib/jestora/localCache";
import type { PlayerProfile, ChaosEvent, Prompt, ProtocolStats, AnyVerdict } from "@/lib/genlayer/types";
import Link from "next/link";

export default function ArenaPage() {
  const { address, isConnected, connect } = useWallet();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [alias, setAlias] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [lastVerdict, setLastVerdict] = useState<AnyVerdict | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([
      getProfile(address),
      getChaosFeed(15),
      getActivePrompts(),
      getProtocolStats(),
    ]).then(([p, cf, ap, s]) => {
      setProfile(p);
      setChaosEvents(cf);
      setPrompts(ap);
      setStats(s);
      setLastVerdict(getLastVerdict() as AnyVerdict | null);
    }).finally(() => setLoading(false));
  }, [address]);

  const handleCreateProfile = async () => {
    if (!address || !alias.trim()) return;
    setIsCreating(true);
    setCreateError("");
    setCreateStatus("Sending to GenLayer...");
    try {
      await createProfile(address, alias.trim());
      setCreateStatus("Profile created! Loading...");
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("already")) {
        // Profile exists on-chain but wasn't loaded, just fetch it
        setCreateStatus("Profile found! Loading...");
      } else {
        setCreateError(msg || "Failed to create profile.");
        setCreateStatus("");
        setIsCreating(false);
        return;
      }
    }
    try {
      const p = await getProfile(address);
      setProfile(p);
      setCreateStatus("");
    } catch {
      setCreateError("Profile created but failed to load. Please refresh.");
      setCreateStatus("");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <ArenaShell>
        <div className="max-w-md mx-auto mt-20 text-center space-y-4">
          <p className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Connect to Enter</p>
          <p className="text-sm text-[#6B6257]">Connect your injected wallet to access the arena.</p>
          <Button onClick={connect} size="lg" className="w-full">Connect Wallet</Button>
        </div>
      </ArenaShell>
    );
  }

  if (!profile && !loading) {
    return (
      <ArenaShell>
        <div className="max-w-md mx-auto mt-20 space-y-4">
          <div className="border-4 border-[#FFE600] bg-white p-6 shadow-[6px_6px_0px_#121212]">
            <p className="font-['Rubik_Mono_One',monospace] text-2xl text-[#121212] mb-1">Create Profile</p>
            <p className="text-xs text-[#6B6257] mb-4">Choose an alias to enter Jestor. This goes on-chain via GenLayer.</p>
            <Input
              placeholder="Your alias (2-32 chars)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={32}
              className="mb-3"
            />
            {createError && <p className="text-xs text-[#FF3B30] mb-2">{createError}</p>}
            {createStatus && <p className="text-[10px] font-mono text-[#0057FF] mb-2 animate-pulse">{createStatus}</p>}
            <Button onClick={handleCreateProfile} disabled={isCreating || alias.trim().length < 2} className="w-full">
              {isCreating ? "Waiting for consensus..." : "Create Profile"}
            </Button>
          </div>
        </div>
      </ArenaShell>
    );
  }

  return (
    <ArenaShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">
              {profile?.alias ?? "Arena"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="blue">GenLayer</Badge>
              <span className="text-xs font-mono text-[#6B6257]">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
            </div>
          </div>
          {stats && (
            <div className="flex gap-4 text-xs font-mono text-[#6B6257]">
              <span>{stats.total_profiles} players</span>
              <span>{stats.total_submissions} submissions</span>
              <span>{stats.total_chaos_actions} chaos</span>
            </div>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            {profile && <JestBalanceCard balance={profile.balance} alias={profile.alias} />}
          </div>
          <div className="md:col-span-2 space-y-4">
            <ActivePromptCard prompt={prompts[0] ?? null} />
            <LatestVerdictCard verdict={lastVerdict} />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/caption-rift", label: "Caption Rift", color: "#35E36D" },
            { href: "/roast", label: "Roast Balance", color: "#FF3B30" },
            { href: "/duels", label: "Meme Duels", color: "#7A35FF" },
            { href: "/chaos-lab", label: "Chaos Lab", color: "#FF8BD1" },
          ].map(({ href, label, color }) => (
            <Link key={href} href={href}>
              <div
                className="border-2 border-[#121212] p-3 text-center text-xs font-black uppercase tracking-wider cursor-pointer hover:shadow-[2px_2px_0px_#121212] transition-all"
                style={{ backgroundColor: color }}
              >
                {label}
              </div>
            </Link>
          ))}
        </div>

        {/* Chaos feed */}
        <div className="border-4 border-[#FF8BD1] bg-white shadow-[4px_4px_0px_#121212]">
          <div className="border-b-4 border-[#FF8BD1] bg-[#FF8BD1] px-4 py-2">
            <span className="font-['Rubik_Mono_One',monospace] text-sm text-[#121212]">CHAOS FEED</span>
          </div>
          <div className="p-4">
            <ChaosFeed events={chaosEvents} />
          </div>
        </div>
      </div>
    </ArenaShell>
  );
}
