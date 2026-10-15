/**
 * Controlled Studionet volume generator.
 *
 * This utility intentionally accepts existing CLI-managed keys only. It never
 * generates, prints, stores, or commits private keys. Use it for a bounded
 * post-release read/write check, not as an unattended faucet or wallet tool.
 *
 * Usage:
 *   npx tsx scripts/seed-volume.ts
 *   PLAYER_IMANI_PK=0x... PLAYER_ZOE_PK=0x... PLAYER_LOLA_PK=0x...
 *   PLAYER_AURAH_PK=0x... PLAYER_MARY_PK=0x...
 *   NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x... ROUNDS=1 npx tsx scripts/seed-volume.ts
 */
import { randomBytes, createHash } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant, TransactionStatus, type CalldataEncodable, type Hash } from "genlayer-js/types";
import type { Address } from "viem";

const rawAddress = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? process.env.GL_CONTRACT;
if (!rawAddress) throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS or GL_CONTRACT is required.");
const address = rawAddress as Address;
const rounds = Math.max(1, Math.min(3, Number(process.env.ROUNDS ?? "1")));

type Player = {
  name: string;
  account: ReturnType<typeof createAccount>;
  client: ReturnType<typeof createClient>;
};

function makePlayer(name: string, envName: string): Player {
  const key = process.env[envName];
  if (!key) throw new Error("Missing " + envName + ". Supply an existing CLI-managed wallet key; no key is generated.");
  const account = createAccount(key as Parameters<typeof createAccount>[0]);
  return { name, account, client: createClient({ chain: studionet, account }) };
}

const players = [
  makePlayer("imani", "PLAYER_IMANI_PK"),
  makePlayer("zoe", "PLAYER_ZOE_PK"),
  makePlayer("lola", "PLAYER_LOLA_PK"),
  makePlayer("aurah", "PLAYER_AURAH_PK"),
  makePlayer("mary", "PLAYER_MARY_PK"),
];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function resultName(receipt: unknown): string | undefined {
  const data = record(receipt);
  const named = data.resultName;
  if (typeof named === "string") return named;
  const numeric = data.result;
  return typeof numeric === "number" ? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" } as Record<number, string>)[numeric] : undefined;
}

function executionName(receipt: unknown): string | undefined {
  const data = record(receipt);
  const consensus = record(data.consensus_data);
  const leaders = consensus.leader_receipt;
  const leader = Array.isArray(leaders) ? record(leaders[0]) : {};
  return typeof leader.execution_result === "string" ? leader.execution_result : typeof data.txExecutionResultName === "string" ? data.txExecutionResultName : undefined;
}

function finalized(receipt: unknown): boolean {
  const data = record(receipt);
  return data.statusName === "FINALIZED" || data.status === TransactionStatus.FINALIZED || data.status === 7;
}

async function read(player: Player, method: string, args: unknown[] = []) {
  return player.client.readContract({
    address,
    functionName: method,
    args: args as CalldataEncodable[],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

async function write(player: Player, method: string, args: unknown[]) {
  const hash = await player.client.writeContract({
    address,
    functionName: method,
    args: args as CalldataEncodable[],
    value: BigInt(0),
  });
  const receipt = await player.client.waitForTransactionReceipt({
    hash: hash as Hash,
    status: TransactionStatus.FINALIZED,
    retries: 180,
    interval: 5000,
  });
  if (!finalized(receipt) || resultName(receipt) !== "MAJORITY_AGREE" || executionName(receipt) !== "SUCCESS") {
    throw new Error(method + " did not produce a finalized successful majority-agree receipt.");
  }
  console.log("PASS " + player.name + " " + method + " " + String(hash));
  return { hash: String(hash), receipt };
}

async function ensureProfile(player: Player) {
  const current = await read(player, "get_profile", [player.account.address.toLowerCase()]);
  if (!current || typeof current !== "object" || !Object.keys(current).length) {
    await write(player, "create_profile", [player.name]);
  }
}

function duelId(promptId: string, addressValue: string, nonce: string): string {
  return createHash("sha256")
    .update("JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|" + promptId + "|" + addressValue.toLowerCase() + "|" + nonce)
    .digest("hex")
    .slice(0, 24);
}

function commitment(id: string, promptId: string, addressValue: string, entry: string, salt: string): string {
  return createHash("sha256")
    .update("JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|" + id + "|" + promptId + "|" + addressValue.toLowerCase() + "|" + salt + "|" + entry.trim())
    .digest("hex");
}

async function main() {
  const chainId = await players[0].client.getChainId();
  if (Number(chainId) !== 61999) throw new Error("Refusing to sign on chain " + chainId + "; expected Studionet chain 61999.");
  console.log("Studionet chain verified: " + chainId);
  console.log("Contract: " + address);
  console.log("Wallets: " + players.map((player) => player.name + "=" + player.account.address).join(", "));

  for (const player of players) await ensureProfile(player);

  const tag = randomBytes(8).toString("hex");
  const promptText = "A " + tag + " librarian audits a parade of moon geese while every teacup claims to be the referee.";
  await write(players[0], "create_prompt", [promptText]);
  const prompts = await read(players[0], "get_active_prompts", []);
  const prompt = Array.isArray(prompts) ? prompts.map(record).find((item) => item.text === promptText) : undefined;
  const promptId = typeof prompt?.id === "string" ? prompt.id : "";
  if (!promptId) throw new Error("The finalized prompt was not returned by get_active_prompts.");

  for (let round = 0; round < rounds; round += 1) {
    for (let index = 0; index < players.length; index += 1) {
      await write(players[index], "submit_caption", [promptId, "Round " + round + " caption " + index + ": the moon goose filed the joke before the teacup could object."]);
    }
  }

  const entryA = "Player A's moon goose filed a punchline before the teacup referee woke up.";
  const entryB = "Player B's teacup replied that the filing was still awaiting quorum.";
  const saltA = randomBytes(18).toString("hex");
  const saltB = randomBytes(18).toString("hex");
  const nonce = randomBytes(18).toString("hex");
  const id = duelId(promptId, players[0].account.address, nonce);
  await write(players[0], "start_duel", [promptId, commitment(id, promptId, players[0].account.address, entryA, saltA), nonce]);
  await write(players[1], "join_duel", [id, commitment(id, promptId, players[1].account.address, entryB, saltB)]);
  await write(players[0], "reveal_duel_entry", [id, entryA, saltA]);
  await write(players[1], "reveal_duel_entry", [id, entryB, saltB]);
  await write(players[2], "resolve_duel", [id]);
  const duel = record(await read(players[0], "get_duel", [id]));
  if (duel.status !== "resolved" || duel.finalized !== true) throw new Error("Volume duel did not settle.");

  const profile = await read(players[0], "get_profile", [players[0].account.address.toLowerCase()]);
  const leaderboard = await read(players[0], "get_leaderboard", []);
  if (!profile || !Array.isArray(leaderboard)) throw new Error("Authoritative final readback failed.");
  console.log(JSON.stringify({ contract: address, chainId: Number(chainId), promptId, duelId: id, rounds, leaderboardSize: leaderboard.length }));
}

main().catch((error) => {
  console.error("FAIL " + (error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
