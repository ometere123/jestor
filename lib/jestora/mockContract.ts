"use client";

// Mock contract for development when NEXT_PUBLIC_USE_MOCK_CONTRACT=true
// Returns realistic fake data without needing a running Studionet.

import type {
  PlayerProfile,
  Submission,
  Duel,
  Prompt,
  ChaosEvent,
  LeaderboardEntry,
  ProtocolStats,
} from "../genlayer/types";

const fakeProfiles: Record<string, PlayerProfile> = {};
const fakeBalances: Record<string, number> = {};

const fakePrompts: Prompt[] = [
  { id: "p001", text: "A validator walks into a group chat and refuses to agree.", author: "0xmock", active: true, created_at: Date.now() / 1000 - 3600 },
  { id: "p002", text: "Your wallet balance wakes up and starts giving life advice.", author: "0xmock", active: true, created_at: Date.now() / 1000 - 7200 },
  { id: "p003", text: "A smart contract tries stand-up comedy for the first time.", author: "0xmock", active: true, created_at: Date.now() / 1000 - 1800 },
];

const fakeLeaderboard: LeaderboardEntry[] = [
  { address: "0xABCD...1234", alias: "NoodleChaos", balance: 842, duel_wins: 7 },
  { address: "0xDEAD...BEEF", alias: "VaporZine", balance: 631, duel_wins: 4 },
  { address: "0xFACE...CAFE", alias: "MemeGoblin", balance: 517, duel_wins: 3 },
  { address: "0x1337...C0DE", alias: "GlitchProphet", balance: 403, duel_wins: 2 },
  { address: "0xBEEF...DEAD", alias: "ChaosEditor", balance: 289, duel_wins: 1 },
];

const fakeChaosEvents: ChaosEvent[] = [
  { type: "chaos", alias: "NoodleChaos", chaos_class: "BLESSING", title: "Validator Chose Violence", flavor_text: "The oracle sneezed confetti.", delta: 55, reason: "Pure absurdist energy", timestamp: Date.now() / 1000 - 300 },
  { type: "caption", alias: "VaporZine", outcome: "ABSURD_GENIUS", delta: 80, reason: "Prompt fit was chef's kiss", timestamp: Date.now() / 1000 - 900 },
  { type: "duel", alias_a: "MemeGoblin", alias_b: "GlitchProphet", winner: "A", reason: "Entry A had more chaos energy", timestamp: Date.now() / 1000 - 1800 },
  { type: "roast", alias: "ChaosEditor", outcome: "BRUTAL_BUT_SAFE", delta: 35, reason: "Genuinely funny self-roast", timestamp: Date.now() / 1000 - 2700 },
];

async function mockDelay(ms = 800): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeFakeSubmissionId(): string {
  return Math.random().toString(36).slice(2, 14);
}

export const mockContract = {
  async read(method: string, args: unknown[]): Promise<unknown> {
    await mockDelay(400);
    switch (method) {
      case "get_profile": {
        const addr = args[0] as string;
        const p = fakeProfiles[addr];
        if (!p) return {};
        return { ...p, balance: fakeBalances[addr] ?? 0 };
      }
      case "get_balance":
        return fakeBalances[args[0] as string] ?? 0;
      case "get_active_prompts":
        return fakePrompts;
      case "get_leaderboard":
        return fakeLeaderboard;
      case "get_chaos_feed":
        return fakeChaosEvents.slice(0, (args[0] as number) ?? 20);
      case "get_protocol_stats":
        return { total_submissions: 142, total_duels: 17, total_chaos_actions: 38, total_profiles: 23 } as ProtocolStats;
      case "get_submission":
        return {} as Submission;
      case "get_duel":
        return {} as Duel;
      default:
        return null;
    }
  },

  async write(method: string, args: unknown[], sender: string): Promise<string> {
    await mockDelay(1200);
    switch (method) {
      case "create_profile": {
        const alias = args[0] as string;
        fakeProfiles[sender] = {
          alias,
          address: sender,
          created_at: Date.now() / 1000,
          caption_count: 0,
          roast_count: 0,
          chaos_count: 0,
          duel_wins: 0,
          safety_flags: 0,
          balance: 0,
        };
        fakeBalances[sender] = 0;
        break;
      }
      case "submit_caption":
      case "submit_roast_self":
      case "invoke_chaos_action": {
        const delta = Math.floor(Math.random() * 70) + 10;
        fakeBalances[sender] = (fakeBalances[sender] ?? 0) + delta;
        break;
      }
    }
    return `0x${makeFakeSubmissionId()}`;
  },
};
