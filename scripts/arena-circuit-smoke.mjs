/**
 * Finalized Studionet integration suite for Arena Circuit v0.4.
 *
 * The runner requires 4-6 existing CLI-managed wallets in GL_PK1..GL_PK6.
 * It never prints or persists private keys. Every write must finalize with a
 * successful majority-agree receipt; an RPC error is never treated as a
 * passing negative test.
 *
 * Run:
 *   GL_CONTRACT=0x... GL_PK1=0x... GL_PK2=0x... GL_PK3=0x... GL_PK4=0x...
 *   node scripts/arena-circuit-smoke.mjs
 */
import { createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";

const CONTRACT = process.env.GL_CONTRACT ?? process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
if (!CONTRACT) throw new Error("Missing GL_CONTRACT or NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS.");

const keys = Array.from({ length: 6 }, (_, index) => process.env["GL_PK" + (index + 1)]).filter(Boolean);
if (keys.length < 4) throw new Error("Supply at least GL_PK1 through GL_PK4.");

const players = keys.map((key) => {
  const account = createAccount(key);
  return { account, client: createClient({ chain: studionet, account }) };
});

const transactions = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function statusName(receipt) {
  return receipt?.statusName ?? receipt?.status_name ?? (receipt?.status === 7 ? "FINALIZED" : undefined);
}

function resultName(receipt) {
  return receipt?.resultName ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" }[receipt?.result]);
}

function executionName(receipt) {
  return receipt?.consensus_data?.leader_receipt?.[0]?.execution_result ?? receipt?.txExecutionResultName;
}

function executionError(receipt) {
  const name = executionName(receipt);
  return name === "ERROR" || name === "FINISHED_WITH_ERROR";
}

async function read(player, method, args = []) {
  return player.client.readContract({
    address: CONTRACT,
    functionName: method,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

async function write(player, method, args = [], options = {}) {
  const hash = await player.client.writeContract({ address: CONTRACT, functionName: method, args, value: 0n });
  const receipt = await player.client.waitForTransactionReceipt({
    hash,
    status: "FINALIZED",
    retries: 240,
    interval: 5000,
    fullTransaction: true,
  });
  if (statusName(receipt) !== "FINALIZED") throw new Error(method + " did not finalize.");
  if (resultName(receipt) !== "MAJORITY_AGREE") throw new Error(method + " did not reach MAJORITY_AGREE.");
  if (options.expectError) {
    if (!executionError(receipt)) throw new Error("Expected finalized contract rejection did not occur for " + method + ".");
    console.log("PASS expected rejection " + method + " " + String(hash));
    return { hash: String(hash), receipt, ok: false };
  }
  if (executionError(receipt)) throw new Error(method + " finalized with contract execution error.");
  transactions.push({ method, hash: String(hash), status: statusName(receipt), result: resultName(receipt), execution: executionName(receipt) });
  console.log("PASS " + method + " " + String(hash));
  return { hash: String(hash), receipt, ok: true };
}

async function expectRejection(label, fn) {
  await fn({ expectError: true });
  console.log("PASS " + label);
}

async function ensureProfile(player, index) {
  const address = player.account.address.toLowerCase();
  const profile = await read(player, "get_profile", [address]);
  if (!profile || !Object.keys(profile).length) await write(player, "create_profile", ["circuit-" + (index + 1)]);
}

function duelId(promptId, address, nonce) {
  return createHash("sha256")
    .update("JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|" + promptId + "|" + address.toLowerCase() + "|" + nonce)
    .digest("hex")
    .slice(0, 24);
}

function commitment(id, promptId, address, entry, salt) {
  return createHash("sha256")
    .update("JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|" + id + "|" + promptId + "|" + address.toLowerCase() + "|" + salt + "|" + entry.trim())
    .digest("hex");
}

async function waitUntil(timestamp, label) {
  let lastLog = 0;
  while (Math.floor(Date.now() / 1000) < timestamp) {
    const remaining = timestamp - Math.floor(Date.now() / 1000);
    if (remaining !== lastLog && (remaining <= 10 || remaining % 60 === 0)) {
      console.log("Waiting " + remaining + "s for " + label + "...");
      lastLog = remaining;
    }
    await sleep(Math.min(1000, Math.max(250, remaining * 1000)));
  }
}

export async function runSmoke() {
  const chainId = await players[0].client.getChainId();
  if (Number(chainId) !== 61999) throw new Error("Refusing to sign on chain " + chainId + "; expected 61999.");
  console.log("Studionet verified: chain " + chainId + ", RPC " + studionet.rpcUrls.default.http[0]);
  console.log("Contract under test: " + CONTRACT);
  for (let index = 0; index < players.length; index += 1) {
    const native = await players[index].client.getBalance({ address: players[index].account.address });
    if (native === 0n) throw new Error("Wallet " + (index + 1) + " has no native Studionet balance.");
    await ensureProfile(players[index], index);
  }

  const tag = randomBytes(8).toString("hex");
  const promptText = "A " + tag + " librarian teaches moon geese to audit a backwards parade of singing teacups.";
  await write(players[0], "create_prompt", [promptText]);
  const active = await read(players[0], "get_active_prompts", []);
  const prompt = active.find((item) => item?.text === promptText);
  if (!prompt?.id || prompt.moderation !== "APPROVED") throw new Error("Finalized prompt is not approved and discoverable.");
  await expectRejection("invalid prompt reference", (options) => write(players[0], "submit_caption", ["not-a-prompt", "This must be rejected on-chain."], options));

  const captionText = "The moon goose filed the punchline before the teacup referee could object.";
  const captionTx = await write(players[0], "submit_caption", [prompt.id, captionText]);
  const recent = await read(players[0], "get_recent_submissions", [prompt.id, 30]);
  const caption = recent.find((item) => item?.author?.toLowerCase() === players[0].account.address.toLowerCase() && item?.type === "caption" && item?.text === captionText);
  if (!caption?.id || !caption.finalized) throw new Error("Caption result readback is not finalized.");

  const remixText = "The goose became chief auditor, and the teacup appealed the joke to a parade of filing cabinets.";
  const remixTx = await write(players[2], "submit_remix", [prompt.id, caption.id, remixText]);
  const remixId = await read(players[2], "get_latest_submission_id", [players[2].account.address.toLowerCase()]);
  const remix = await read(players[2], "get_submission", [remixId]);
  if (!remix?.finalized || remix.source_id !== caption.id) throw new Error("Remix attribution/readback failed.");
  await expectRejection("copied remix", (options) => write(players[2], "submit_remix", [prompt.id, caption.id, captionText], options));

  await write(players[1], "submit_roast_self", [prompt.id, "My debugging strategy is to rename the bug and call it architecture."]);
  const roastId = await read(players[1], "get_latest_submission_id", [players[1].account.address.toLowerCase()]);
  if (typeof roastId !== "string" || !roastId) throw new Error("Roast result identifier was not indexed.");
  await write(players[3], "challenge_verdict", [roastId, "Reassess the roast safety, outcome, and deterministic point effect."]);
  const challengedRoast = await read(players[0], "get_verdict", [roastId]);
  const challengedHistory = await read(players[0], "get_verdict_history", [roastId, 12]);
  if (!challengedRoast?.challenged || !Array.isArray(challengedHistory) || challengedHistory.length < 2) throw new Error("Finalized challenge correction was not readable.");
  await write(players[2], "invoke_chaos_action", [prompt.id, "A harmless confetti storm celebrates a joke that survived review."]);

  const duelEntryA = "The validator asked the block for a punchline and received a pending receipt.";
  const duelEntryB = "The block replied that its jokes were still waiting for quorum.";
  const saltA = randomBytes(18).toString("hex");
  const saltB = randomBytes(18).toString("hex");
  const nonce = randomBytes(18).toString("hex");
  const duel = duelId(prompt.id, players[0].account.address, nonce);
  await write(players[0], "start_duel", [prompt.id, commitment(duel, prompt.id, players[0].account.address, duelEntryA, saltA), nonce]);
  await expectRejection("player A reveal before player B joins", (options) => write(players[0], "reveal_duel_entry", [duel, duelEntryA, saltA], options));
  await write(players[1], "join_duel", [duel, commitment(duel, prompt.id, players[1].account.address, duelEntryB, saltB)]);
  const hidden = await read(players[0], "get_duel", [duel]);
  if (hidden.entry_a || hidden.entry_b) throw new Error("Duel entries were exposed before valid reveals.");
  await expectRejection("wrong duel salt", (options) => write(players[0], "reveal_duel_entry", [duel, duelEntryA, "wrong-salt-000"], options));
  await write(players[0], "reveal_duel_entry", [duel, duelEntryA, saltA]);
  await write(players[1], "reveal_duel_entry", [duel, duelEntryB, saltB]);
  await expectRejection("replayed duel reveal", (options) => write(players[1], "reveal_duel_entry", [duel, duelEntryB, saltB], options));
  await write(players[3], "resolve_duel", [duel]);
  const resolvedDuel = await read(players[0], "get_duel", [duel]);
  if (resolvedDuel.status !== "resolved" || !resolvedDuel.finalized || !resolvedDuel.entry_a || !resolvedDuel.entry_b) throw new Error("Duel did not settle after valid reveals.");

  // Leave a bounded margin for consensus finalization before registration
  // closes; the contract still enforces its own 1-minute minimum lead.
  const startsAt = Math.floor(Date.now() / 1000) + 300;
  await write(players[0], "create_tournament", [prompt.id, startsAt]);
  const open = await read(players[0], "get_open_tournaments", []);
  const tournament = open.find((item) => item?.starts_at === startsAt) ?? open[0];
  if (!tournament?.id) throw new Error("Tournament is not discoverable after finalization.");
  const circuitEntries = [
    "The librarian turns a moon-goose parade into a precise comedy appeal, complete with a teacup referee who stamps every punchline guilty of fowl play.",
    "I like jokes.",
    "A moon goose cross-examines the teacup referee, files the punchline under absurd jurisprudence, and wins applause from the entire library parade.",
    "I am a potato.",
  ];
  for (let index = 0; index < 4; index += 1) {
    await write(players[index], "join_tournament", [tournament.id, circuitEntries[index] + " " + tag]);
  }
  const registered = await read(players[0], "get_tournament", [tournament.id]);
  if (registered.players?.length !== 4 || registered.stage !== "registration") throw new Error("Tournament registration is not exactly four players.");
  await waitUntil(startsAt + 2, "scheduled tournament start");
  await write(players[3], "settle_tournament_match", [tournament.id, 0]);
  await write(players[3], "settle_tournament_match", [tournament.id, 1]);
  const semis = await read(players[0], "get_tournament", [tournament.id]);
  if (semis.stage !== "semifinals" || semis.matches[0].status === "pending" || semis.matches[1].status === "pending") throw new Error("Semifinals did not settle.");
  if (semis.finalized) throw new Error("Tournament finalized before semifinal challenge windows closed.");
  const semiUntil = Math.max(semis.matches[0].challenge_eligible_until, semis.matches[1].challenge_eligible_until);
  await waitUntil(semiUntil + 1, "semifinal challenge windows");
  const readyForFinal = await read(players[0], "get_tournament", [tournament.id]);
  if (readyForFinal.stage === "blocked" || readyForFinal.finalized) throw new Error("Tournament was blocked before final without a disputed result.");
  await write(players[3], "settle_tournament_match", [tournament.id, 2]);
  const afterFinal = await read(players[0], "get_tournament", [tournament.id]);
  if (!afterFinal.matches?.[2]?.finalized || afterFinal.finalized) throw new Error("Final settlement did not remain challenge-gated.");
  await waitUntil(afterFinal.matches[2].challenge_eligible_until + 1, "final challenge window");
  await write(players[3], "finalize_tournament", [tournament.id]);
  const settledTournament = await read(players[0], "get_tournament", [tournament.id]);
  if (!settledTournament.finalized || settledTournament.status !== "settled" || !settledTournament.champion) throw new Error("Tournament did not produce a legitimate champion.");

  const verdict = await read(players[0], "get_verdict", [caption.id]);
  const history = await read(players[0], "get_verdict_history", [caption.id, 12]);
  const career = await read(players[0], "get_career", [players[0].account.address.toLowerCase()]);
  const leaderboard = await read(players[0], "get_leaderboard", []);
  if (verdict.finality !== "state_finalized" || verdict.receipt_finality !== "client_receipt_required" || !Array.isArray(history) || !career?.career_scope || !Array.isArray(leaderboard)) {
    throw new Error("Public verdict, history, career, or leaderboard readback is incomplete.");
  }
  console.log(JSON.stringify({
    contract: CONTRACT,
    chainId: Number(chainId),
    players: players.map((player) => player.account.address),
    promptId: prompt.id,
    captionId: caption.id,
    captionTx: captionTx.hash,
    roastId,
    remixId,
    remixTx: remixTx.hash,
    duelId: duel,
    tournamentId: tournament.id,
    transactionCount: transactions.length,
    transactions,
  }, null, 2));
  return { contract: CONTRACT, chainId: Number(chainId), promptId: prompt.id, captionId: caption.id, duelId: duel, tournamentId: tournament.id, transactions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmoke().catch((error) => {
    console.error("FAIL " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  });
}
