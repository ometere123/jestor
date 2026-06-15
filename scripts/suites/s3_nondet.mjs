/**
 * Suite 3 - Non-deterministic functions.
 * Tests every function that calls gl.vm.run_nondet_unsafe (LLM judgement).
 */

import { clientA, clientB, ADDR_A, ADDR_B } from "../lib/clients.mjs";
import {
  callWrite, callRead,
  assert, assertEqual, assertIn, assertInRange, assertNonEmpty,
  shortAddr,
} from "../lib/helpers.mjs";

const CAPTION_OUTCOMES = ["TRY_AGAIN", "SMALL_LAUGH", "CLEAN_HIT", "ABSURD_GENIUS", "TOO_DERIVATIVE", "BLOCKED"];
const ROAST_OUTCOMES = ["HUMBLE_PIE", "BRUTAL_BUT_SAFE", "TRY_AGAIN", "BLOCKED"];
const CHAOS_CLASSES = ["BLESSING", "CURSE", "MIRROR", "CONFETTI", "NULL_EVENT"];
const DUEL_WINNERS = ["A", "B", "DRAW", "NO_CONTEST"];
const TAG = Date.now().toString(36).toUpperCase();

async function latestFeedEvent(type, authorAddr) {
  const feed = await callRead(clientA, "get_chaos_feed", [20]);
  return feed?.find((e) => e.type === type && e.author?.toLowerCase() === authorAddr.toLowerCase()) ?? null;
}

export async function runNonDet({ promptId }) {
  console.log("-- SUITE 3: Non-deterministic (LLM-judged) -----------------");
  const results = [];

  const pA = await callRead(clientA, "get_profile", [ADDR_A]);
  const pB = await callRead(clientA, "get_profile", [ADDR_B]);
  assert(pA?.alias, "Wallet A has profile (prereq for suite 3)");
  assert(pB?.alias, "Wallet B has profile (prereq for suite 3)");

  let pid = promptId;
  if (!pid) {
    const prompts = await callRead(clientA, "get_active_prompts");
    pid = prompts?.[0]?.id;
    assert(pid, "At least one active prompt required for suite 3");
  }

  {
    const balB4 = Number(await callRead(clientA, "get_balance", [ADDR_A]));
    const caption = `When your portfolio strategy is just astrology and vibes S3_${TAG}`;
    const r = await callWrite(clientA, "submit_caption", [pid, caption], `A(${shortAddr(ADDR_A)})`);

    if (!r.ok && r.error?.toLowerCase().includes("cooldown")) {
      results.push("3.1 submit_caption: COOLDOWN ACTIVE - skipped");
    } else {
      assert(r.ok, `submit_caption must succeed - stderr: ${r.error ?? ""}`);
      const execResult = r.receipt?.consensus_data?.leader_receipt?.[0]?.execution_result;
      assert(execResult !== "UNDETERMINED", "caption execution must not be UNDETERMINED");

      const event = await latestFeedEvent("caption", ADDR_A);
      assert(!!event, "caption event in chaos feed");
      assertIn(event.outcome, CAPTION_OUTCOMES, "caption outcome enum");
      assertInRange(event.delta, 0, 80, "caption delta range");
      assertNonEmpty(event.reason, "caption reason");
      assertNonEmpty(event.alias, "caption alias");

      const balAf = Number(await callRead(clientA, "get_balance", [ADDR_A]));
      const delta = balAf - balB4;
      assertInRange(delta, 0, 80, "caption balance delta");
      assert(delta === event.delta, `balance delta (${delta}) matches feed event delta (${event.delta})`);

      const profileAf = await callRead(clientA, "get_profile", [ADDR_A]);
      assert(Number(profileAf?.caption_count) > Number(pA?.caption_count ?? -1), "caption_count incremented");
      results.push(`3.1 submit_caption OK outcome=${event.outcome} delta=+${event.delta}`);
    }
  }

  {
    const balB4 = Number(await callRead(clientA, "get_balance", [ADDR_A]));
    const roast = "I am the loading spinner of human beings - always spinning, never loading anything useful";
    const r = await callWrite(clientA, "submit_roast_self", [roast], `A(${shortAddr(ADDR_A)})`);

    if (!r.ok && r.error?.toLowerCase().includes("cooldown")) {
      results.push("3.2 submit_roast_self: COOLDOWN ACTIVE - skipped");
    } else {
      assert(r.ok, `submit_roast_self must succeed - stderr: ${r.error ?? ""}`);
      const event = await latestFeedEvent("roast", ADDR_A);
      assert(!!event, "roast event in chaos feed");
      assertIn(event.outcome, ROAST_OUTCOMES, "roast outcome enum");
      assertInRange(event.delta, 0, 40, "roast delta range");
      assertNonEmpty(event.reason, "roast reason");

      const balAf = Number(await callRead(clientA, "get_balance", [ADDR_A]));
      const delta = balAf - balB4;
      assertInRange(delta, 0, 40, "roast balance delta");
      assert(delta === event.delta, `balance delta (${delta}) matches feed event (${event.delta})`);

      const profileAf = await callRead(clientA, "get_profile", [ADDR_A]);
      assert(Number(profileAf?.roast_count) >= 1, "roast_count incremented");
      results.push(`3.2 submit_roast_self OK outcome=${event.outcome} delta=+${event.delta}`);
    }
  }

  {
    const balB4 = Number(await callRead(clientA, "get_balance", [ADDR_B]));
    const action = "I hereby declare that all memes must be uploaded sideways for one full day";
    const r = await callWrite(clientB, "invoke_chaos_action", [action], `B(${shortAddr(ADDR_B)})`);

    if (!r.ok && r.error?.toLowerCase().includes("cooldown")) {
      results.push("3.3 invoke_chaos_action: COOLDOWN ACTIVE (24h) - skipped");
    } else {
      assert(r.ok, `invoke_chaos_action must succeed - stderr: ${r.error ?? ""}`);
      const event = await latestFeedEvent("chaos", ADDR_B);
      assert(!!event, "chaos event in feed for wallet B");
      assertIn(event.chaos_class, CHAOS_CLASSES, "chaos_class enum");
      assertInRange(event.delta, -25, 75, "chaos delta range [-25,75]");
      assertNonEmpty(event.title, "chaos title non-empty");
      assertNonEmpty(event.flavor_text, "chaos flavor_text non-empty");
      assertNonEmpty(event.reason, "chaos reason non-empty");

      const balAf = Number(await callRead(clientA, "get_balance", [ADDR_B]));
      const delta = balAf - balB4;
      assertInRange(delta, -25, 75, "chaos balance delta");
      assert(delta === event.delta, `balance delta (${delta}) matches event (${event.delta})`);

      const profileB = await callRead(clientA, "get_profile", [ADDR_B]);
      assert(Number(profileB?.chaos_count) >= 1, "chaos_count incremented");
      results.push(`3.3 invoke_chaos_action OK class=${event.chaos_class} delta=${event.delta >= 0 ? "+" : ""}${event.delta}`);
    }
  }

  {
    const duelEntryA = `My meme is a 5-year compound interest calculator for vibes S3_${TAG}`;
    const duelEntryB = `The chart of my self-awareness is a horizontal line S3_${TAG}`;

    const balAb4 = Number(await callRead(clientA, "get_balance", [ADDR_A]));
    const balBb4 = Number(await callRead(clientA, "get_balance", [ADDR_B]));

    const rStart = await callWrite(clientA, "start_duel", [pid, duelEntryA], `A(${shortAddr(ADDR_A)})`);
    if (!rStart.ok) {
      if (rStart.error?.toLowerCase().includes("cooldown")) {
        results.push("3.4 resolve_duel: DUEL-START COOLDOWN ACTIVE - skipped");
      } else {
        assert(false, `start_duel failed unexpectedly: ${rStart.error}`);
      }
    } else {
      const duelId = await callRead(clientA, "get_latest_duel_id", [ADDR_A]);
      assertNonEmpty(duelId, "latest duel id available after start_duel");
      console.log(`  -> duel id discovered: ${duelId}`);

      const rJoin = await callWrite(clientB, "join_duel", [duelId, duelEntryB], `B(${shortAddr(ADDR_B)})`);
      assert(rJoin.ok, `join_duel must succeed: ${rJoin.error ?? ""}`);

      const duelAfJoin = await callRead(clientA, "get_duel", [duelId]);
      assertEqual(duelAfJoin?.status, "ready", "duel status=ready after join");
      assertEqual(duelAfJoin?.player_b?.toLowerCase(), ADDR_B.toLowerCase(), "player_b=Wallet B");

      const rResolve = await callWrite(clientA, "resolve_duel", [duelId], `A(${shortAddr(ADDR_A)})`);
      assert(rResolve.ok, `resolve_duel must succeed: ${rResolve.error ?? ""}`);

      const duelAf = await callRead(clientA, "get_duel", [duelId]);
      assertEqual(duelAf?.status, "resolved", "duel status=resolved");
      assertNonEmpty(duelAf?.verdict, "verdict non-null");

      const v = duelAf.verdict;
      assertIn(v.winner, DUEL_WINNERS, "duel winner enum");
      assertInRange(v.entry_a_score, 0, 100, "entry_a_score range");
      assertInRange(v.entry_b_score, 0, 100, "entry_b_score range");
      assertNonEmpty(v.reason, "duel reason non-empty");
      assertIn(v.safety_class, ["SAFE", "UNSAFE"], "duel safety_class enum");
      if (v.winner !== "NO_CONTEST") {
        assertInRange(v.a_delta, 0, 60, "a_delta range");
        assertInRange(v.b_delta, 0, 60, "b_delta range");
      }

      const balAaf = Number(await callRead(clientA, "get_balance", [ADDR_A]));
      const balBaf = Number(await callRead(clientA, "get_balance", [ADDR_B]));
      assertInRange(balAaf - balAb4, 0, 60, "wallet A duel balance delta");
      assertInRange(balBaf - balBb4, 0, 60, "wallet B duel balance delta");

      if (v.winner === "A") {
        const profA = await callRead(clientA, "get_profile", [ADDR_A]);
        assert(Number(profA?.duel_wins) >= 1, "A duel_wins incremented");
      }

      results.push(`3.4 resolve_duel OK winner=${v.winner} status=resolved`);
    }
  }

  console.log("\n  SUITE 3 SUMMARY:");
  for (const r of results) console.log(`    ${r}`);
}
