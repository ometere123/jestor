/**
 * Seeds the deployed Jestor contract with 3 test players who each exercise
 * every write path: profile creation, caption, self-roast, chaos action,
 * prompt creation, and a full duel (start -> join -> resolve).
 *
 * Usage: npx tsx scripts/seed-players.ts
 *
 * Reads NEXT_PUBLIC_GENLAYER_* from .env.local. Generates a fresh private
 * key per player unless PLAYER_*_PK env vars are supplied.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local not found, rely on already-set env vars
  }
}
loadEnvLocal();

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Hash } from "genlayer-js/types";

const rawAddress = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
if (!rawAddress) throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS not set in .env.local");
const address = rawAddress as `0x${string}`;

type Player = {
  name: string;
  privateKey: `0x${string}`;
  account: ReturnType<typeof createAccount>;
  client: ReturnType<typeof createClient>;
};

function makePlayer(name: string, existingKey?: string): Player {
  const privateKey = (existingKey as `0x${string}`) ?? generatePrivateKey();
  const account = createAccount(privateKey);
  const client = createClient({ chain: studionet, account });
  return { name, privateKey, account, client };
}

async function callWrite(player: Player, method: string, args: unknown[]) {
  console.log(`  -> [${player.name}] ${method}(${JSON.stringify(args)})`);
  const hash = await player.client.writeContract({
    address,
    functionName: method,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    value: BigInt(0),
  });
  const receipt = await player.client.waitForTransactionReceipt({
    hash: hash as Hash,
    retries: 60,
    interval: 5000,
  });
  const status = (receipt as { status?: unknown })?.status;
  console.log(`     hash=${hash} status=${String(status)}`);
  return receipt;
}

async function callRead(player: Player, method: string, args: unknown[] = []) {
  return player.client.readContract({
    address,
    functionName: method,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
  });
}

async function main() {
  const players = [
    makePlayer("imani", process.env.PLAYER_IMANI_PK),
    makePlayer("zoe", process.env.PLAYER_ZOE_PK),
    makePlayer("lola", process.env.PLAYER_LOLA_PK),
  ];

  console.log("Generated/loaded accounts:");
  for (const p of players) {
    console.log(`  ${p.name}: address=${p.account.address} privateKey=${p.privateKey}`);
  }

  // 1. Create profiles
  console.log("\n== create_profile ==");
  for (const p of players) {
    await callWrite(p, "create_profile", [p.name]);
  }

  // 2. Each submits a caption
  console.log("\n== submit_caption ==");
  const captions = [
    "A validator walks into a group chat and refuses to agree... so it forks the conversation.",
    "Your wallet balance wakes up and starts giving life advice: 'diversify your feelings.'",
    "A smart contract tries stand-up comedy for the first time and reverts on the punchline.",
  ];
  for (let i = 0; i < players.length; i++) {
    await callWrite(players[i], "submit_caption", [`p00${i + 1}`, captions[i]]);
  }

  // 3. Each submits a self-roast
  console.log("\n== submit_roast_self ==");
  const roasts = [
    "I debug my life the way I debug code: by adding console.logs and hoping.",
    "I have the confidence of someone who has never read their own git blame.",
    "My sense of humor is like my code coverage: technically present, rarely tested.",
  ];
  for (let i = 0; i < players.length; i++) {
    await callWrite(players[i], "submit_roast_self", [roasts[i]]);
  }

  // 4. Each invokes a chaos action
  console.log("\n== invoke_chaos_action ==");
  const chaosActions = [
    "Imani flips a coin to decide whether the next duel winner gets bonus points.",
    "Zoe summons a confetti storm over the leaderboard.",
    "Lola mirrors the last chaos event back at whoever triggered it.",
  ];
  for (let i = 0; i < players.length; i++) {
    await callWrite(players[i], "invoke_chaos_action", [chaosActions[i]]);
  }

  // 5. One player creates a fresh prompt for the duel round
  console.log("\n== create_prompt ==");
  await callWrite(players[0], "create_prompt", [
    "Three players walk into a smart contract and only two make it to consensus.",
  ]);

  // 6. Full duel: imani starts, zoe joins, lola resolves
  console.log("\n== duel: start -> join -> resolve ==");
  const [imani, zoe, lola] = players;
  await callWrite(imani, "start_duel", [
    "p002",
    "Imani's entry: My validator ghosted the consensus round and left me on read.",
  ]);

  const latestDuelId = await callRead(imani, "get_latest_duel_id", [imani.account.address.toLowerCase()]);
  const duelId = typeof latestDuelId === "string" ? latestDuelId : null;
  if (!duelId) {
    console.log("  Could not resolve duel id from get_latest_duel_id, skipping join/resolve.");
  } else {
    console.log(`  duelId=${duelId}`);
    await callWrite(zoe, "join_duel", [
      duelId,
      "Zoe's entry: My validator didn't ghost me, it just needed 2/3 majority to text back.",
    ]);
    await callWrite(lola, "resolve_duel", [duelId]);
  }

  // 6b. Second duel, left unjoined/unresolved on purpose so get_open_duels has
  // something in the "waiting" state to return.
  console.log("\n== duel: start only (left waiting, for get_open_duels) ==");
  await callWrite(zoe, "start_duel", [
    "p005",
    "Zoe's entry: The consensus engine argued with itself and both sides lost.",
  ]);
  const openDuelIdRaw = await callRead(zoe, "get_latest_duel_id", [zoe.account.address.toLowerCase()]);
  const openDuelId = typeof openDuelIdRaw === "string" ? openDuelIdRaw : null;
  console.log(`  waiting duelId=${openDuelId}`);

  // 6c. Edge case: a deliberately mean-spirited caption aimed at testing the
  // safety/moderation path (TOO_MEAN / UNSAFE / BLOCKED verdicts, safety_flags).
  console.log("\n== edge case: borderline/mean caption (safety path) ==");
  const profileBefore = await callRead(imani, "get_profile", [imani.account.address.toLowerCase()]);
  await callWrite(imani, "submit_caption", [
    "p007",
    "Nobody at this table has an original thought, you're all just recycled bad takes wearing a costume.",
  ]);
  const profileAfter = await callRead(imani, "get_profile", [imani.account.address.toLowerCase()]);
  console.log("  imani safety_flags before:", JSON.stringify((profileBefore as { safety_flags?: number })?.safety_flags));
  console.log("  imani safety_flags after: ", JSON.stringify((profileAfter as { safety_flags?: number })?.safety_flags));

  // 7. Exercise every remaining read method.
  console.log("\n== remaining reads ==");
  for (const p of players) {
    const balance = await callRead(imani, "get_balance", [p.account.address.toLowerCase()]);
    console.log(`  get_balance(${p.name}):`, JSON.stringify(balance));
  }
  if (duelId) {
    const resolvedDuel = await callRead(imani, "get_duel", [duelId]);
    console.log("  get_duel(resolved):", JSON.stringify(resolvedDuel));
  }
  // get_submission requires an id that no getter exposes (ids are only known
  // server-side at creation time via a non-deterministic timestamp hash), so
  // this call demonstrates the "not found" path with a bogus id.
  const missingSubmission = await callRead(imani, "get_submission", ["000000000000"]);
  console.log("  get_submission(unknown id) ->", JSON.stringify(missingSubmission));

  const openDuels = await callRead(imani, "get_open_duels", []);
  console.log("  get_open_duels:", JSON.stringify(openDuels));
  const allDuels = await callRead(imani, "get_all_duels", []);
  console.log("  get_all_duels:", JSON.stringify(allDuels));
  const activePrompts = await callRead(imani, "get_active_prompts", []);
  console.log("  get_active_prompts:", JSON.stringify(activePrompts));
  const chaosFeed = await callRead(imani, "get_chaos_feed", [10]);
  console.log("  get_chaos_feed:", JSON.stringify(chaosFeed));

  // 8. Final state summary
  console.log("\n== final state ==");
  for (const p of players) {
    const profile = await callRead(imani, "get_profile", [p.account.address.toLowerCase()]);
    console.log(`  ${p.name} profile:`, JSON.stringify(profile));
  }
  const stats = await callRead(imani, "get_protocol_stats", []);
  console.log("  protocol stats:", JSON.stringify(stats));
  const leaderboard = await callRead(imani, "get_leaderboard", []);
  console.log("  leaderboard:", JSON.stringify(leaderboard));

  console.log("\nDone. Save these private keys if you want to reuse these identities:");
  for (const p of players) {
    console.log(`  ${p.name}: ${p.privateKey}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
