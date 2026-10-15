/**
 * Live Arena Circuit smoke test.
 *
 * Requires four to six funded CLI-managed/private-key test wallets supplied
 * through GL_PK1 ... GL_PK6. Keys are read only from the environment and are
 * never printed or written to disk.
 *
 * Run after deployment:
 *   GL_CONTRACT=0x... GL_PK1=0x... ... GL_PK4=0x... node scripts/arena-circuit-smoke.mjs
 */

import { createHash, randomUUID } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT = process.env.GL_CONTRACT ?? process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
if (!CONTRACT) throw new Error("Missing GL_CONTRACT or NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS.");

const keys = Array.from({ length: 6 }, (_, index) => process.env[`GL_PK${index + 1}`]).filter(Boolean);
if (keys.length < 4) throw new Error("Supply at least GL_PK1 through GL_PK4; five or six wallets are recommended.");

const players = keys.map((key) => {
  const account = createAccount(key);
  return { account, client: createClient({ chain: studionet, account }) };
});

const hashes = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function read(player, method, args = []) {
  return player.client.readContract({ address: CONTRACT, functionName: method, args });
}

async function write(player, method, args = []) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const hash = await player.client.writeContract({ address: CONTRACT, functionName: method, args, value: 0n });
      const receipt = await player.client.waitForTransactionReceipt({
        hash,
        status: "FINALIZED",
        retries: 180,
        interval: 5000,
        fullTransaction: true,
      });
      if (receipt.statusName !== "FINALIZED") throw new Error(`${method} did not finalize: ${receipt.statusName ?? receipt.status}`);
      const leaderExecution = receipt.consensus_data?.leader_receipt?.[0]?.execution_result;
      if (leaderExecution === "ERROR" || receipt.txExecutionResultName === "FINISHED_WITH_ERROR") throw new Error(`${method} finalized with contract execution error: ${hash}`);
      const resultName = receipt.resultName ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" }[receipt.result] ?? String(receipt.result));
      if (resultName === "MAJORITY_DISAGREE") {
        if (attempt < 4) {
          console.log(`RETRY ${method}: independent validators disagreed on attempt ${attempt}`);
          await sleep(3000);
          continue;
        }
        throw new Error(`${method} finalized without majority agreement: ${hash}`);
      }
      hashes.push({ method, hash: String(hash), status: receipt.statusName, result: resultName, execution: receipt.txExecutionResultName ?? "unknown" });
      console.log(`PASS ${method} ${String(hash)}`);
      return { hash: String(hash), receipt };
    } catch (error) {
      const message = String(error?.message ?? error);
      if (!/rate limit|fetch failed|unexpected token|unknown rpc|not valid json/i.test(message) || attempt >= 4) throw error;
      const delay = /rate limit/i.test(message) ? 65000 : 5000;
      console.log(`RETRY ${method}: transient RPC failure on attempt ${attempt}`);
      await sleep(delay);
    }
  }
  throw new Error(`${method} exhausted consensus retries.`);
}

async function expectFailure(label, fn) {
  try {
    await fn();
  } catch {
    console.log(`PASS expected failure: ${label}`);
    return;
  }
  throw new Error(`Expected failure did not occur: ${label}`);
}

function commit(promptId, address, entry, salt) {
  return createHash("sha256")
    .update(`JESTOR-DUEL-V1|${promptId}|${address.toLowerCase()}|${salt}|${entry.trim()}`)
    .digest("hex");
}

async function ensureProfile(player, index) {
  const address = player.account.address.toLowerCase();
  const profile = await read(player, "get_profile", [address]);
  if (!profile || !Object.keys(profile).length) await write(player, "create_profile", [`circuit-${index + 1}`]);
}

async function main() {
  const chainId = await players[0].client.getChainId();
  if (Number(chainId) !== 61999) throw new Error(`Refusing to sign on chain ${chainId}; expected 61999.`);
  console.log(`Studionet verified: chain ${chainId}, RPC ${studionet.rpcUrls.default.http[0]}`);
  console.log(`Contract under test: ${CONTRACT}`);

  for (let index = 0; index < players.length; index += 1) await ensureProfile(players[index], index);

  const nonce = randomUUID().slice(0, 8);
  const promptText = `A ${["submarine", "clockwork", "cloud-borne", "underground"][Math.floor(Math.random() * 4)]} librarian named ${nonce} teaches three moon geese how to audit a backwards parade of singing teacups.`;
  await write(players[0], "create_prompt", [promptText]);
  const prompts = await read(players[0], "get_active_prompts", []);
  const prompt = prompts.find((item) => item.text === promptText) ?? prompts[0];
  if (!prompt?.id) throw new Error("No active prompt returned after finalized creation.");
  await expectFailure("invalid prompt reference", () => write(players[0], "submit_caption", ["not-a-prompt", "This must be rejected on-chain."]));

  const caption = await write(players[0], "submit_caption", [prompt.id, "The submarine librarian stamped the moon geese into the backwards teacup parade, then declared the singing minutes fully audited."]);
  const submissions = await read(players[0], "get_recent_submissions", [prompt.id, 30]);
  const captionResult = submissions.find((item) => item.author === players[0].account.address.toLowerCase() && item.type === "caption");
  if (!captionResult?.id || !captionResult.finalized) throw new Error("Caption did not produce a finalized result.");
  await write(players[0], "record_transaction_hash", [captionResult.id, caption.hash]);
  await write(players[3], "challenge_verdict", [captionResult.id, "Reassess whether the original caption was genuinely relevant and transformative."]);
  await expectFailure("duplicate challenge", () => write(players[3], "challenge_verdict", [captionResult.id, "This second challenge must be rejected."]));

  await write(players[1], "submit_roast_self", [prompt.id, "My debugging strategy is to rename the bug and call it architecture."]);
  await write(players[2], "invoke_chaos_action", [prompt.id, "A harmless confetti storm celebrates every validator who reads the prompt twice."]);

  const remix = await write(players[2], "submit_remix", [prompt.id, captionResult.id, "The submarine librarian promoted the moon geese to quorum clerks, so the singing teacups filed the backwards parade minutes as a meme."]);
  const remixId = await read(players[2], "get_latest_submission_id", [players[2].account.address.toLowerCase()]);
  const remixResult = await read(players[2], "get_submission", [remixId]);
  if (!remixResult?.id || !remixResult.finalized) throw new Error("Remix did not produce a finalized result.");
  await write(players[2], "record_transaction_hash", [remixResult.id, remix.hash]);
  await expectFailure("copied remix", () => write(players[2], "submit_remix", [prompt.id, captionResult.id, captionResult.text]));

  const duelEntryA = "The validator asked the block for a punchline and got a timeout.", duelSaltA = `salt-a-${Date.now()}`;
  const duelEntryB = "The block replied that its jokes were still pending consensus.", duelSaltB = `salt-b-${Date.now()}`;
  await write(players[0], "start_duel", [prompt.id, commit(prompt.id, players[0].account.address, duelEntryA, duelSaltA)]);
  const duelId = await read(players[0], "get_latest_duel_id", [players[0].account.address.toLowerCase()]);
  if (!duelId) throw new Error("No duel id returned after finalized start.");
  await write(players[1], "join_duel", [duelId, commit(prompt.id, players[1].account.address, duelEntryB, duelSaltB)]);
  const hidden = await read(players[0], "get_duel", [duelId]);
  if (hidden.entry_a || hidden.entry_b) throw new Error("Sealed duel entries were exposed before valid reveals.");
  await expectFailure("wrong reveal salt", () => write(players[0], "reveal_duel_entry", [duelId, duelEntryA, "wrong-salt-000"]));
  await write(players[0], "reveal_duel_entry", [duelId, duelEntryA, duelSaltA]);
  await write(players[1], "reveal_duel_entry", [duelId, duelEntryB, duelSaltB]);
  await write(players[3], "resolve_duel", [duelId]);
  const duel = await read(players[0], "get_duel", [duelId]);
  if (duel.status !== "resolved" || !duel.finalized || !duel.entry_a || !duel.entry_b) throw new Error("Duel did not settle after both valid reveals.");
  await expectFailure("replayed resolution", () => write(players[3], "resolve_duel", [duelId]));
  const startsAt = Math.floor(Date.now() / 1000) + 125;
  await write(players[0], "create_tournament", [prompt.id, startsAt]);
  const openTournaments = await read(players[0], "get_open_tournaments", []);
  const tournament = openTournaments[0];
  if (!tournament?.id) throw new Error("Tournament was not visible after finalization.");
  for (let index = 0; index < 4; index += 1) await write(players[index], "join_tournament", [tournament.id, `Circuit entry ${index + 1}: a joke about validators and deadlines.`]);
  const beforeStart = await read(players[0], "get_tournament", [tournament.id]);
  if (beforeStart.players.length !== 4 || beforeStart.stage !== "registration") throw new Error("Tournament registration is not bounded at four players.");
  console.log("Waiting for scheduled tournament start...");
  await sleep(Math.max(0, (startsAt - Math.floor(Date.now() / 1000) + 3) * 1000));
  await write(players[3], "settle_tournament_match", [tournament.id, 0]);
  await write(players[3], "settle_tournament_match", [tournament.id, 1]);
  await write(players[3], "settle_tournament_match", [tournament.id, 2]);
  const finalTournament = await read(players[0], "get_tournament", [tournament.id]);
  if (!finalTournament.finalized || finalTournament.stage !== "complete") throw new Error("Tournament did not finalize after two semifinals and a final.");

  const verdict = await read(players[0], "get_verdict", [captionResult.id]);
  const career = await read(players[0], "get_career", [players[0].account.address.toLowerCase()]);
  if (verdict.finality !== "contract_state_finalized" || !career || !Array.isArray(career.recent_events)) throw new Error("Public verdict/career readback is incomplete.");
  console.log(JSON.stringify({ contract: CONTRACT, chainId: Number(chainId), players: players.map((p) => p.account.address), promptId: prompt.id, captionId: captionResult.id, duelId, tournamentId: tournament.id, txCount: hashes.length, transactions: hashes }, null, 2));
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
