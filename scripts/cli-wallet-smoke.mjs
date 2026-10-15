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
  const invokeArgs = process.platform === "win32"
    ? args.map((value) => {
      const text = String(value);
      return /[\s"]/.test(text) ? `"${text.replace(/(["\\])/g, "\\$1")}"` : text;
    })
    : args;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const result = await run(CLI, invokeArgs, { cwd: process.cwd(), windowsHide: true, shell: process.platform === "win32", maxBuffer: 16 * 1024 * 1024 });
      return result.stdout + result.stderr;
    } catch (error) {
      const stdout = error?.stdout ?? "";
      const stderr = error?.stderr ?? "";
      const details = `${stdout}${stderr}`;
      if (/Rate limit exceeded/i.test(details) && attempt < 3) {
        const delay = 15000 * (attempt + 1);
        console.log(`RPC rate limit; retrying CLI call in ${delay / 1000}s.`);
        await sleep(delay);
        continue;
      }
      throw new Error(`CLI failed (${args.join(" ")}): ${details}`.slice(0, 4000));
    }
  }
  throw new Error(`CLI failed (${args.join(" ")}).`);
}

async function selectAccount(name) {
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
  const leaderExecution = output.match(/execution_result:\s*['"](SUCCESS|ERROR|FINISHED_WITH_ERROR)['"]/i)?.[1]?.toUpperCase();
  const success = leaderExecution === "SUCCESS";
  const error = leaderExecution === "ERROR" || leaderExecution === "FINISHED_WITH_ERROR";
  return { finalized, majority, success, error, leaderExecution };
}

function receiptSummary(output) {
  const status = output.match(/status_name:\s*['"]([^'"]+)['"]/i)?.[1] ?? output.match(/status:\s*(\d+)/i)?.[1] ?? "unknown";
  const result = output.match(/result_name:\s*['"]([^'"]+)['"]/i)?.[1] ?? output.match(/result:\s*(\d+)/i)?.[1] ?? "unknown";
  const votes = [...output.matchAll(/vote:\s*['"]([^'"]+)['"]/gi)].map((match) => match[1]).slice(0, 6);
  return `status=${status} result=${result} leader=${receiptEvidence(output).leaderExecution ?? "unknown"} votes=${votes.join(",") || "unknown"}`;
}

function receiptResultName(output) {
  return output.match(/result_name:\s*['"]([^'"]+)['"]/i)?.[1]?.toUpperCase()
    ?? (output.match(/result:\s*(\d+)/i)?.[1] === "6" ? "MAJORITY_AGREE" : "unknown");
}

async function write(accountName, method, args = [], options = {}) {
  await selectAccount(accountName);
  const output = await cli(["write", CONTRACT, method, "--rpc", RPC, "--args", ...args]);
  const hash = extractHash(output);
  const receipt = await cli(["receipt", hash, "--rpc", RPC, "--status", "FINALIZED"]);
  const evidence = receiptEvidence(receipt);
  const resultName = receiptResultName(receipt);
  if (!evidence.finalized) throw new Error(`${method} did not reach FINALIZED (${hash}; ${receiptSummary(receipt)}).`);
  if (options.retryOnDisagreement && resultName === "MAJORITY_DISAGREE") {
    negativeTransactions.push({ method, hash, finality: "FINALIZED", consensus: resultName, execution: "NOT_APPLIED" });
    console.log(`PASS finalized semantic disagreement (state unchanged) ${method} ${hash}`);
    return { hash, receipt, evidence, disagreement: true };
  }
  if (!evidence.majority) throw new Error(`${method} did not reach FINALIZED / MAJORITY_AGREE (${hash}; ${receiptSummary(receipt)}).`);
  if (options.expectError) {
    if (!evidence.error || evidence.success) throw new Error(`${method} was not a finalized contract rejection.`);
    negativeTransactions.push({ method, hash, finality: "FINALIZED", consensus: "MAJORITY_AGREE", execution: "ERROR" });
    console.log(`PASS expected rejection ${method} ${hash}`);
    return { hash, receipt, evidence };
  }
  if (options.allowError && evidence.error) return { hash, receipt, evidence, contractError: true };
  if (!evidence.success || evidence.error) throw new Error(`${method} finalized with contract execution failure (${hash}; leader=${evidence.leaderExecution ?? "unknown"}).`);
  transactions.push({ method, hash, finality: "FINALIZED", consensus: "MAJORITY_AGREE", execution: "SUCCESS" });
  console.log(`PASS ${method} ${hash}`);
  return { hash, receipt, evidence };
}

async function writeUntilAgreement(accountName, method, args = [], attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await write(accountName, method, args, { retryOnDisagreement: true });
    if (!result.disagreement) return result;
    if (attempt < attempts) {
      console.log(`Retrying ${method} after finalized semantic disagreement (${attempt}/${attempts}).`);
      await sleep(5000);
    }
  }
  throw new Error(`${method} exhausted ${attempts} finalized disagreement retries.`);
}

async function read(method, args = []) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await client.readContract({ address: CONTRACT, functionName: method, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      if (/Rate limit exceeded/i.test(details) && attempt < 3) {
        const delay = 15000 * (attempt + 1);
        console.log(`RPC rate limit on read; retrying in ${delay / 1000}s.`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Read failed: ${method}`);
}

function duelId(promptId, address, nonce) {
  return createHash("sha256").update(`JESTOR-DUEL-V4|61999|${CONTRACT.toLowerCase()}|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|${promptId}|${address.toLowerCase()}|${nonce}`).digest("hex").slice(0, 24);
}

function commitment(id, promptId, address, entry, salt) {
  return createHash("sha256").update(`JESTOR-DUEL-V4|61999|${CONTRACT.toLowerCase()}|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|${id}|${promptId}|${address.toLowerCase()}|${salt}|${entry.trim()}`).digest("hex");
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
  let prompt;
  if (process.env.GL_PROMPT_ID) {
    prompt = await read("get_prompt", [process.env.GL_PROMPT_ID]);
  } else {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const promptText = `A ${tag}-${attempt} librarian watches a parade of moon geese argue with a teacup referee.`;
      const promptWrite = await write(names[0], "create_prompt", [promptText], { allowError: true });
      if (!promptWrite.contractError) {
        const prompts = await read("get_active_prompts");
        prompt = prompts.find((item) => item?.text === promptText);
        if (prompt?.id && prompt.moderation === "APPROVED") break;
      }
      if (attempt < 2) await waitUntil(Math.floor(Date.now() / 1000) + 31, "prompt moderation retry cooldown");
    }
  }
  if (!prompt?.id || prompt.moderation !== "APPROVED" || prompt.active !== true) throw new Error("Prompt approval/readback failed after bounded retries or override validation.");
  await write(names[0], "submit_caption", ["not-a-prompt", "This invalid prompt must be rejected."], { expectError: true });
  let caption;
  if (process.env.GL_CAPTION_ID) {
    caption = await read("get_verdict", [process.env.GL_CAPTION_ID]);
    if (!caption?.id || caption.type !== "caption" || caption.prompt_id !== prompt.id || !caption.finalized || !caption.current_accepted) {
      throw new Error("Caption override is not an accepted finalized caption for the selected prompt.");
    }
    console.log(`PASS reuse accepted finalized caption ${caption.id}`);
  } else {
    const captionText = process.env.GL_CAPTION_TEXT ?? "The punchline waited for validator quorum, filed an appeal, and still got rejected for insufficient gas; the goose called that a career milestone.";
    await write(names[0], "submit_caption", [prompt.id, captionText]);
    const recent = await read("get_recent_submissions", [prompt.id, 30]);
    caption = recent.find((item) => item?.text === captionText);
    if (!caption?.id || !caption.finalized) throw new Error("Caption readback failed.");
  }
  let roastId;
  let roastAlreadyChallenged = false;
  if (process.env.GL_ROAST_ID) {
    const existingRoast = await read("get_verdict", [process.env.GL_ROAST_ID]);
    if (!existingRoast?.id || existingRoast.type !== "roast" || existingRoast.prompt_id !== prompt.id || !existingRoast.finalized || !existingRoast.current_accepted) {
      throw new Error("Roast override is not an accepted finalized roast for the selected prompt.");
    }
    roastId = existingRoast.id;
    roastAlreadyChallenged = Boolean(existingRoast.challenged);
    console.log(`PASS reuse accepted finalized roast ${roastId}`);
  } else {
    const roastText = process.env.GL_ROAST_TEXT ?? "My debugging strategy is to rename the bug and call it architecture.";
    await write(names[1], "submit_roast_self", [prompt.id, roastText]);
    roastId = await read("get_latest_submission_id", [addresses[1]]);
  }
  if (!roastAlreadyChallenged) await write(names[3], "challenge_verdict", [roastId, "Reassess the roast safety, outcome, and deterministic point effect."]);
  else console.log(`PASS reuse settled challenge for ${roastId}`);
  const challenged = await read("get_verdict", [roastId]);
  if (!challenged?.challenged) throw new Error("Challenge correction was not settled.");
  if (process.env.GL_CHAOS_ID) {
    const existingChaos = await read("get_verdict", [process.env.GL_CHAOS_ID]);
    if (!existingChaos?.id || existingChaos.type !== "chaos" || existingChaos.prompt_id !== prompt.id || !existingChaos.finalized) {
      throw new Error("Chaos override is not a finalized chaos result for the selected prompt.");
    }
    console.log(`PASS reuse finalized chaos ${existingChaos.id}`);
  } else {
    await write(names[2], "invoke_chaos_action", [prompt.id, "A harmless confetti storm celebrates a joke that survived review."]);
  }
  let remixId;
  if (process.env.GL_REMIX_ID) {
    const existingRemix = await read("get_verdict", [process.env.GL_REMIX_ID]);
    if (!existingRemix?.id || existingRemix.type !== "remix" || existingRemix.prompt_id !== prompt.id || existingRemix.source_id !== caption.id || !existingRemix.finalized || !existingRemix.current_accepted) {
      throw new Error("Remix override is not an accepted finalized remix for the selected caption.");
    }
    remixId = existingRemix.id;
    console.log(`PASS reuse accepted finalized remix ${remixId}`);
  } else {
    const remixText = process.env.GL_REMIX_TEXT ?? "The moon goose became a theatrical lawyer, while the teacup referee turned the punchline into a filing-cabinet opera with a crown-wearing chorus.";
    await write(names[2], "submit_remix", [prompt.id, caption.id, remixText]);
    remixId = await read("get_latest_submission_id", [addresses[2]]);
  }
  await write(names[2], "submit_remix", [prompt.id, caption.id, caption.text], { expectError: true });

  let duel;
  if (process.env.GL_DUEL_ID) {
    duel = process.env.GL_DUEL_ID;
    const existingDuel = await read("get_duel", [duel]);
    if (!existingDuel?.id || existingDuel.prompt_id !== prompt.id || !existingDuel.finalized || existingDuel.status !== "resolved" || !existingDuel.entry_a || !existingDuel.entry_b || !existingDuel.original_verdict || !existingDuel.verdict) {
      throw new Error("Duel override is not a finalized resolved duel for the selected prompt.");
    }
    console.log(`PASS reuse finalized resolved duel ${duel}`);
  } else {
    const entryA = "The validator asked the block for a punchline and received a pending receipt.";
    const entryB = "The block replied that its jokes were still waiting for quorum.";
    const saltA = randomBytes(18).toString("hex");
    const saltB = randomBytes(18).toString("hex");
    const nonce = randomBytes(18).toString("hex");
    duel = duelId(prompt.id, addresses[0], nonce);
    await write(names[0], "start_duel", [prompt.id, commitment(duel, prompt.id, addresses[0], entryA, saltA), nonce]);
    await write(names[0], "reveal_duel_entry", [duel, entryA, saltA], { expectError: true });
    await write(names[1], "join_duel", [duel, commitment(duel, prompt.id, addresses[1], entryB, saltB)]);
    const hidden = await read("get_duel", [duel]);
    if (hidden.entry_a || hidden.entry_b) throw new Error("Duel entries exposed before reveals.");
    await write(names[0], "reveal_duel_entry", [duel, entryA, saltA]);
    await write(names[1], "reveal_duel_entry", [duel, entryB, saltB]);
    await writeUntilAgreement(names[2], "resolve_duel", [duel]);
    const resolved = await read("get_duel", [duel]);
    if (!resolved.finalized || !resolved.entry_a || !resolved.entry_b) throw new Error("Duel did not settle.");
  }

  // Consensus latency can exceed the nominal registration lead; leave a
  // bounded margin so a valid scheduled tournament is not rejected merely
  // because create_tournament finalized near the deadline.
  let tournament;
  if (process.env.GL_TOURNAMENT_ID) {
    tournament = await read("get_tournament", [process.env.GL_TOURNAMENT_ID]);
    if (!tournament?.id || tournament.prompt_id !== prompt.id || tournament.players?.length !== 4 || tournament.finalized) {
      throw new Error("Tournament override is not an open four-player tournament for the selected prompt.");
    }
    console.log(`PASS reuse indexed tournament ${tournament.id}`);
  } else {
    const startsAt = Math.floor(Date.now() / 1000) + 300;
    await write(names[0], "create_tournament", [prompt.id, String(startsAt)]);
    const open = await read("get_open_tournaments");
    tournament = open.find((item) => item?.starts_at === startsAt) ?? open[0];
    if (!tournament?.id) throw new Error("Tournament was not indexed.");
    const circuitEntries = [
      "The librarian turns a moon-goose parade into a precise comedy appeal, complete with a teacup referee who stamps every punchline guilty of fowl play.",
      "I like jokes.",
      "A moon goose cross-examines the teacup referee, files the punchline under absurd jurisprudence, and wins applause from the entire library parade.",
      "I am a potato.",
    ];
    for (let index = 0; index < 4; index += 1) await write(names[index], "join_tournament", [tournament.id, `${circuitEntries[index]} ${tag}`]);
  }
  await waitUntil(Number(tournament.starts_at) + 2, "scheduled tournament start");
  await writeUntilAgreement(names[3], "settle_tournament_match", [tournament.id, "0"]);
  await writeUntilAgreement(names[3], "settle_tournament_match", [tournament.id, "1"]);
  const semis = await read("get_tournament", [tournament.id]);
  if (semis.finalized || semis.matches?.[0]?.status === "pending" || semis.matches?.[1]?.status === "pending") throw new Error("Semifinal settlement/progression failed.");
  await waitUntil(Math.max(semis.matches[0].challenge_eligible_until, semis.matches[1].challenge_eligible_until) + 1, "semifinal challenge windows");
  await writeUntilAgreement(names[3], "settle_tournament_match", [tournament.id, "2"]);
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
    try { await selectAccount("praest-deployer"); } catch { /* preserve original failure */ }
  });
}
