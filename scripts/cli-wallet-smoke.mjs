/**
 * Finalized Studionet smoke using the repository-local GenLayer CLI account
 * store. This runner switches existing named CLI accounts; it never reads,
 * exports, prints, or stores private keys.
 *
 * Required:
 *   GL_CONTRACT=0x... node scripts/cli-wallet-smoke.mjs
 * Optional:
 *   CLI_ARENA_ACCOUNTS=party_a,walletA,walletB,conveyance-deployer
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";
import { pathToFileURL } from "node:url";

const run = promisify(execFile);
const CLI = process.platform === "win32" ? ".\\node_modules\\.bin\\genlayer.cmd" : "./node_modules/.bin/genlayer";
const RPC = "https://studio.genlayer.com/api";
const CONTRACT = process.env.GL_CONTRACT;
if (!CONTRACT) throw new Error("GL_CONTRACT is required.");
if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT)) throw new Error("GL_CONTRACT must be a contract address.");

const names = (process.env.CLI_ARENA_ACCOUNTS ?? "party_a,walletA,walletB,conveyance-deployer")
  .split(",").map((value) => value.trim()).filter(Boolean);
if (names.length < 4 || names.length > 6) throw new Error("Use four to six existing CLI account names.");

const client = createClient({ chain: studionet });
const transactions = [];
const negativeTransactions = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cli(args) {
  try {
    const result = await run(CLI, args, { cwd: process.cwd(), windowsHide: true, shell: process.platform === "win32", maxBuffer: 16 * 1024 * 1024 });
    return result.stdout + result.stderr;
  } catch (error) {
    const stdout = error?.stdout ?? "";
    const stderr = error?.stderr ?? "";
    throw new Error(`CLI failed (${args.join(" ")}): ${stdout}${stderr}`.slice(0, 4000));
  }
}

async function useAccount(name) {
  await cli(["account", "use", name]);
}

async function accountAddress(name) {
  const output = await cli(["account", "show", "--account", name, "--rpc", RPC]);
  const match = output.match(/address:\s*['"](0x[0-9a-fA-F]{40})['"]/i);
  if (!match) throw new Error(`No address returned for CLI account ${name}.`);
  const balance = output.match(/balance:\s*['"]([^'"]+)['"]/i)?.[1] ?? "0";
  if (/^0(?:\.0+)?(?:\s|$)/.test(balance)) throw new Error(`CLI account ${name} is not funded.`);
  return match[1].toLowerCase();
}

function extractHash(output) {
  const match = output.match(/Write Transaction Hash:\s*\r?\n(0x[0-9a-fA-F]{64})/i);
  if (!match) throw new Error("CLI write did not return a transaction hash.");
  return match[1];
}

function receiptEvidence(output) {
  const finalized = /status_name:\s*['"]FINALIZED['"]|status:\s*7\b/i.test(output);
  const majority = /result_name:\s*['"]MAJORITY_AGREE['"]|result:\s*6\b/i.test(output);
  const success = /execution_result:\s*['"]SUCCESS['"]/i.test(output);
  const error = /execution_result:\s*['"](?:ERROR|FINISHED_WITH_ERROR)['"]|error_description:\s*['"](?!['"])/i.test(output);
  return { finalized, majority, success, error };
}

async function write(accountName, method, args = [], options = {}) {
  await useAccount(accountName);
  const output = await cli(["write", CONTRACT, method, "--rpc", RPC, "--args", ...args]);
  const hash = extractHash(output);
  const receipt = await cli(["receipt", hash, "--rpc", RPC, "--status", "FINALIZED"]);
  const evidence = receiptEvidence(receipt);
  if (!evidence.finalized || !evidence.majority) throw new Error(`${method} did not reach FINALIZED / MAJORITY_AGREE.`);
  if (options.expectError) {
    if (!evidence.error || evidence.success) throw new Error(`${method} was not a finalized contract rejection.`);
    negativeTransactions.push({ method, hash, finality: "FINALIZED", consensus: "MAJORITY_AGREE", execution: "ERROR" });
    console.log(`PASS expected rejection ${method} ${hash}`);
    return { hash, receipt, evidence };
  }
  if (!evidence.success || evidence.error) throw new Error(`${method} finalized with contract execution failure.`);
  transactions.push({ method, hash, finality: "FINALIZED", consensus: "MAJORITY_AGREE", execution: "SUCCESS" });
  console.log(`PASS ${method} ${hash}`);
  return { hash, receipt, evidence };
}

async function read(method, args = []) {
  return client.readContract({ address: CONTRACT, functionName: method, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
}

function duelId(promptId, address, nonce) {
  return createHash("sha256").update(`JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|${promptId}|${address.toLowerCase()}|${nonce}`).digest("hex").slice(0, 24);
}

function commitment(id, promptId, address, entry, salt) {
  return createHash("sha256").update(`JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|${id}|${promptId}|${address.toLowerCase()}|${salt}|${entry.trim()}`).digest("hex");
}

async function waitUntil(timestamp, label) {
  let last = -1;
  while (Math.floor(Date.now() / 1000) < timestamp) {
    const remaining = timestamp - Math.floor(Date.now() / 1000);
    if (remaining <= 10 || remaining % 60 === 0) {
      if (remaining !== last) console.log(`Waiting ${remaining}s for ${label}...`);
      last = remaining;
    }
    await sleep(Math.min(1000, Math.max(250, remaining * 1000)));
  }
}

export async function runSmoke() {
  const chainId = await client.getChainId();
  if (Number(chainId) !== 61999) throw new Error(`Refusing to test chain ${chainId}; expected 61999.`);
  const addresses = [];
  for (const name of names) addresses.push(await accountAddress(name));
  for (let index = 0; index < names.length; index += 1) {
    const profile = await read("get_profile", [addresses[index]]);
    if (!profile || !Object.keys(profile).length) await write(names[index], "create_profile", [`cli-${index + 1}`]);
  }

  const tag = randomBytes(8).toString("hex");
  const promptText = `A ${tag} librarian teaches moon geese to audit a backwards parade of singing teacups.`;
  await write(names[0], "create_prompt", [promptText]);
  const prompts = await read("get_active_prompts");
  const prompt = prompts.find((item) => item?.text === promptText);
  if (!prompt?.id || prompt.moderation !== "APPROVED") throw new Error("Prompt approval/readback failed.");
  await write(names[0], "submit_caption", ["not-a-prompt", "This invalid prompt must be rejected."], { expectError: true });
  const captionText = "The moon goose filed the punchline before the teacup referee could object.";
  await write(names[0], "submit_caption", [prompt.id, captionText]);
  const recent = await read("get_recent_submissions", [prompt.id, 30]);
  const caption = recent.find((item) => item?.text === captionText);
  if (!caption?.id || !caption.finalized) throw new Error("Caption readback failed.");
  await write(names[1], "submit_roast_self", [prompt.id, "My debugging strategy is to rename the bug and call it architecture."]);
  const roastId = await read("get_latest_submission_id", [addresses[1]]);
  await write(names[3], "challenge_verdict", [roastId, "Reassess the roast safety, outcome, and deterministic point effect."]);
  const challenged = await read("get_verdict", [roastId]);
  if (!challenged?.challenged) throw new Error("Challenge correction was not settled.");
  await write(names[2], "invoke_chaos_action", [prompt.id, "A harmless confetti storm celebrates a joke that survived review."]);
  await write(names[2], "submit_remix", [prompt.id, caption.id, "The goose became chief auditor, and the teacup appealed the joke to filing cabinets."]);
  await write(names[2], "submit_remix", [prompt.id, caption.id, captionText], { expectError: true });

  const entryA = "The validator asked the block for a punchline and received a pending receipt.";
  const entryB = "The block replied that its jokes were still waiting for quorum.";
  const saltA = randomBytes(18).toString("hex");
  const saltB = randomBytes(18).toString("hex");
  const nonce = randomBytes(18).toString("hex");
  const duel = duelId(prompt.id, addresses[0], nonce);
  await write(names[0], "start_duel", [prompt.id, commitment(duel, prompt.id, addresses[0], entryA, saltA), nonce]);
  await write(names[0], "reveal_duel_entry", [duel, entryA, saltA], { expectError: true });
  await write(names[1], "join_duel", [duel, commitment(duel, prompt.id, addresses[1], entryB, saltB)]);
  const hidden = await read("get_duel", [duel]);
  if (hidden.entry_a || hidden.entry_b) throw new Error("Duel entries exposed before reveals.");
  await write(names[0], "reveal_duel_entry", [duel, entryA, saltA]);
  await write(names[1], "reveal_duel_entry", [duel, entryB, saltB]);
  await write(names[2], "resolve_duel", [duel]);
  const resolved = await read("get_duel", [duel]);
  if (!resolved.finalized || !resolved.entry_a || !resolved.entry_b) throw new Error("Duel did not settle.");

  const startsAt = Math.floor(Date.now() / 1000) + 75;
  await write(names[0], "create_tournament", [prompt.id, String(startsAt)]);
  const open = await read("get_open_tournaments");
  const tournament = open.find((item) => item?.starts_at === startsAt) ?? open[0];
  if (!tournament?.id) throw new Error("Tournament was not indexed.");
  for (let index = 0; index < 4; index += 1) await write(names[index], "join_tournament", [tournament.id, `Circuit entry ${index + 1} with a distinct moon-goose filing joke ${tag}`]);
  await waitUntil(startsAt + 2, "scheduled tournament start");
  await write(names[3], "settle_tournament_match", [tournament.id, "0"]);
  await write(names[3], "settle_tournament_match", [tournament.id, "1"]);
  const semis = await read("get_tournament", [tournament.id]);
  if (semis.finalized || semis.matches?.[0]?.status === "pending" || semis.matches?.[1]?.status === "pending") throw new Error("Semifinal settlement/progression failed.");
  await waitUntil(Math.max(semis.matches[0].challenge_eligible_until, semis.matches[1].challenge_eligible_until) + 1, "semifinal challenge windows");
  await write(names[3], "settle_tournament_match", [tournament.id, "2"]);
  const afterFinal = await read("get_tournament", [tournament.id]);
  if (afterFinal.finalized) throw new Error("Finalized before the final challenge window closed.");
  await waitUntil(afterFinal.matches[2].challenge_eligible_until + 1, "final challenge window");
  await write(names[3], "finalize_tournament", [tournament.id]);
  const settled = await read("get_tournament", [tournament.id]);
  if (!settled.finalized || settled.status !== "settled" || !settled.champion) throw new Error("Tournament did not settle legitimately.");

  const history = await read("get_verdict_history", [roastId, 12]);
  const career = await read("get_career", [addresses[0]]);
  const leaderboard = await read("get_leaderboard");
  if (!Array.isArray(history) || history.length < 2 || !career?.career_scope || !Array.isArray(leaderboard)) throw new Error("Career/history/leaderboard readback failed.");
  console.log(JSON.stringify({ contract: CONTRACT, chainId: Number(chainId), accounts: names, addresses, promptId: prompt.id, captionId: caption.id, roastId, duelId: duel, tournamentId: tournament.id, finalizedTransactions: transactions, finalizedNegativeTests: negativeTransactions }, null, 2));
  return { contract: CONTRACT, chainId: Number(chainId), promptId: prompt.id, captionId: caption.id, roastId, duelId: duel, tournamentId: tournament.id, transactions, negativeTransactions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmoke().catch((error) => {
    console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }).finally(async () => {
    try { await useAccount("praest-deployer"); } catch { /* preserve original failure */ }
  });
}
