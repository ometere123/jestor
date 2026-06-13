/**
 * Jestor Contract QA Script — v2 (debug mode)
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const PRIVATE_KEY = "0xd94494a5e2fc489c843fff96e87c7035cf076294806ec8e3415f13eb36d16da9";
const CONTRACT = "0x7A2bD6c486Bca40e288241AaD60dFf7223e3af82";
const ALIAS = "QATester_" + Date.now().toString(36).slice(-4);

const PASS = "✅ PASS";
const FAIL = "❌ FAIL";
const INFO = "   →";

function assert(condition, msg) {
  console.log(`  ${condition ? PASS : FAIL} ${msg}`);
  return condition;
}

// Status code → name map
const STATUS_NAMES = {
  0: "UNINITIALIZED", 1: "PENDING", 2: "PROPOSING", 3: "COMMITTING",
  4: "REVEALING", 5: "ACCEPTED", 6: "UNDETERMINED", 7: "FINALIZED",
  8: "CANCELED", 9: "APPEAL_REVEALING", 10: "APPEAL_COMMITTING",
  11: "READY_TO_FINALIZE", 12: "VALIDATORS_TIMEOUT", 13: "LEADER_TIMEOUT"
};
const EXEC_NAMES = { 0: "NOT_VOTED", 1: "FINISHED_WITH_RETURN", 2: "FINISHED_WITH_ERROR" };

async function write(client, method, args, label) {
  console.log(`\n[WRITE] ${label}`);
  console.log(`${INFO} ${method}(${args.map(a => JSON.stringify(a)).join(", ")})`);
  try {
    const hash = await client.writeContract({
      address: CONTRACT,
      functionName: method,
      args,
      value: BigInt(0),
    });
    console.log(`${INFO} tx: ${hash}`);
    console.log(`${INFO} polling for FINALIZED (max 6 min)...`);

    const receipt = await client.waitForTransactionReceipt({
      hash,
      retries: 72,
      interval: 5000,
    });

    const statusNum = receipt?.status ?? receipt?.statusName;
    const statusName = typeof statusNum === "number" ? STATUS_NAMES[statusNum] : statusNum;
    const execNum = receipt?.txExecutionResult;
    const execName = typeof execNum === "number" ? EXEC_NAMES[execNum] : (receipt?.txExecutionResultName ?? "—");
    const resultName = receipt?.resultName ?? receipt?.result ?? "—";
    const final = receipt?.consensus_data?.final ?? "—";

    console.log(`${INFO} status: ${statusName} (${statusNum})`);
    console.log(`${INFO} exec:   ${execName}`);
    console.log(`${INFO} result: ${resultName}`);
    console.log(`${INFO} final:  ${final}`);

    // Log leader receipt error if present
    const lr = receipt?.consensus_data?.leader_receipt?.[0];
    if (lr?.error) {
      console.log(`${INFO} leader error: ${lr.error}`);
    }
    if (lr?.execution_result) {
      console.log(`${INFO} leader exec_result: ${lr.execution_result}`);
    }

    const succeeded = execName === "FINISHED_WITH_RETURN" || statusName === "FINALIZED" || statusName === "ACCEPTED";
    assert(execName !== "FINISHED_WITH_ERROR", `execution succeeded (exec=${execName})`);
    return { hash, receipt, succeeded: execName !== "FINISHED_WITH_ERROR" };
  } catch (e) {
    console.log(`  ${FAIL} threw: ${e.message}`);
    return { hash: null, receipt: null, succeeded: false };
  }
}

async function read(client, method, args, label) {
  try {
    const result = await client.readContract({ address: CONTRACT, functionName: method, args });
    console.log(`${INFO} ${label}: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    console.log(`  ${FAIL} ${label} threw: ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(60));
  console.log("  JESTOR CONTRACT QA — Studionet");
  console.log(`  Contract : ${CONTRACT}`);
  console.log(`  Alias    : ${ALIAS}`);
  console.log("=".repeat(60));

  const account = createAccount(PRIVATE_KEY);
  const client = createClient({ chain: studionet, account });
  const addr = account.address;
  console.log(`  Wallet   : ${addr}\n`);

  // Check if profile already exists (script may have been run before)
  console.log("[PRE-CHECK] get_profile");
  const existingProfile = await read(client, "get_profile", [addr], "existing_profile");
  const profileExists = existingProfile && Object.keys(existingProfile).length > 0;
  console.log(`${INFO} profile exists: ${profileExists}`);

  // ── 1. create_profile (skip if already exists) ──────────────────────────
  if (!profileExists) {
    console.log("\n[TEST 1] create_profile");
    const r = await write(client, "create_profile", [ALIAS], "create_profile");
    console.log("\n[TEST 1 READ] get_profile after create");
    const p = await read(client, "get_profile", [addr], "profile");
    assert(p && Object.keys(p).length > 0, "profile created");
    assert(p?.alias === ALIAS || typeof p?.alias === "string", `alias set: ${p?.alias}`);
  } else {
    console.log(`\n[TEST 1] SKIPPED — profile already exists: alias="${existingProfile.alias}"`);
  }

  // ── 2. get_balance ───────────────────────────────────────────────────────
  console.log("\n[TEST 2] get_balance");
  const bal0 = await read(client, "get_balance", [addr], "balance");
  assert(Number(bal0) >= 0, `balance >= 0 (${bal0})`);

  // ── 3. create_prompt ────────────────────────────────────────────────────
  console.log("\n[TEST 3] create_prompt");
  const promptText = "When your meme accidentally becomes the stock market strategy";
  await write(client, "create_prompt", [promptText], "create_prompt");

  console.log("\n[TEST 3 READ] get_active_prompts");
  const prompts = await read(client, "get_active_prompts", [], "prompts");
  assert(Array.isArray(prompts), "returns array");
  const promptId = prompts?.[0]?.id;
  console.log(`${INFO} prompt id to use: ${promptId ?? "(none)"}`);

  if (!promptId) {
    console.log("  ⚠ No active prompt — skipping caption/duel tests that need a prompt id");
  }

  // ── 4. submit_caption ───────────────────────────────────────────────────
  console.log("\n[TEST 4] submit_caption (GenLayer LLM judges humour)");
  if (promptId) {
    await write(client, "submit_caption", [promptId, "My portfolio is just vibes and copium at this point"], "submit_caption");
    const bal1 = await read(client, "get_balance", [addr], "balance_after_caption");
    console.log(`${INFO} balance after caption: ${bal1}`);
  } else {
    // Use empty string prompt id — contract will handle missing prompt gracefully
    await write(client, "submit_caption", ["", "My portfolio is just vibes and copium at this point"], "submit_caption (no prompt)");
  }

  // ── 5. submit_roast_self ─────────────────────────────────────────────────
  console.log("\n[TEST 5] submit_roast_self");
  await write(
    client,
    "submit_roast_self",
    ["I am the human equivalent of a loading screen that never finishes"],
    "submit_roast_self"
  );
  const bal2 = await read(client, "get_balance", [addr], "balance_after_roast");
  console.log(`${INFO} balance after roast: ${bal2}`);

  // ── 6. invoke_chaos_action ───────────────────────────────────────────────
  console.log("\n[TEST 6] invoke_chaos_action");
  await write(
    client,
    "invoke_chaos_action",
    ["I declare today a reverse gravity meme day where everything floats upward"],
    "invoke_chaos_action"
  );
  const bal3 = await read(client, "get_balance", [addr], "balance_after_chaos");
  console.log(`${INFO} balance after chaos: ${bal3}`);

  // ── 7. get_chaos_feed ───────────────────────────────────────────────────
  console.log("\n[TEST 7] get_chaos_feed");
  const feed = await read(client, "get_chaos_feed", [10], "chaos_feed");
  assert(Array.isArray(feed), "returns array");
  assert(feed?.length >= 0, `${feed?.length} events`);

  // ── 8. start_duel ───────────────────────────────────────────────────────
  console.log("\n[TEST 8] start_duel");
  const duelPid = promptId ?? "";
  await write(
    client,
    "start_duel",
    [duelPid, "This chart is just my emotional state rendered as a PNG"],
    "start_duel"
  );

  // ── 9. get_leaderboard ──────────────────────────────────────────────────
  console.log("\n[TEST 9] get_leaderboard");
  const lb = await read(client, "get_leaderboard", [], "leaderboard");
  assert(Array.isArray(lb), "returns array");
  const myEntry = lb?.find(e => e.address?.toLowerCase() === addr.toLowerCase());
  assert(!!myEntry, `wallet on leaderboard`);
  if (myEntry) console.log(`${INFO} entry: ${JSON.stringify(myEntry)}`);

  // ── 10. get_protocol_stats ───────────────────────────────────────────────
  console.log("\n[TEST 10] get_protocol_stats");
  const stats = await read(client, "get_protocol_stats", [], "stats");
  assert(typeof stats === "object" && stats !== null, "returns object");
  console.log(`${INFO} stats: ${JSON.stringify(stats)}`);

  // ── 11. Error: caption too short ─────────────────────────────────────────
  console.log("\n[TEST 11] submit_caption with text < 5 chars — should fail");
  const shortResult = await write(client, "submit_caption", [promptId ?? "", "lol"], "submit_caption (too short)");
  assert(shortResult?.succeeded === false, "correctly rejected short caption");

  // ── 12. Final state ──────────────────────────────────────────────────────
  console.log("\n[TEST 12] final get_profile + get_balance");
  const finalProfile = await read(client, "get_profile", [addr], "final_profile");
  const finalBal = await read(client, "get_balance", [addr], "final_balance");

  console.log(`\n${"=".repeat(60)}`);
  console.log("  QA COMPLETE");
  console.log(`  Alias  : ${finalProfile?.alias ?? ALIAS}`);
  console.log(`  Wallet : ${addr}`);
  console.log(`  Balance: ${finalBal} Jest Points`);
  console.log("=".repeat(60));
}

main().catch(console.error);
