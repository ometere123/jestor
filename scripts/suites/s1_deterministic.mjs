/**
 * Suite 1 - Deterministic happy path.
 * Tests every deterministic state transition end-to-end.
 * Uses Wallet A (PK1) as primary and Wallet B (PK2) for duel join.
 *
 * Covered: create_profile, create_prompt, start_duel, join_duel
 * (submit_caption / roast / chaos / resolve_duel are in s3_nondet)
 */

import { clientA, clientB, ADDR_A, ADDR_B } from "../lib/clients.mjs";
import {
  callWrite, callRead,
  assert, assertEqual, assertNonEmpty,
  shortAddr,
} from "../lib/helpers.mjs";

const TAG = Date.now().toString(36).toUpperCase();
const ALIAS_A = `S1A_${TAG}`;
const ALIAS_B = `S1B_${TAG}`;
const PROMPT_TEXT = `When your meme is also your tax strategy S1_${TAG}`;
let EFFECTIVE_ALIAS_A = ALIAS_A;

export async function runDeterministic() {
  console.log("-- SUITE 1: Deterministic happy path -----------------------");
  const results = [];
  let promptId, duelId;

  {
    const existing = await callRead(clientA, "get_profile", [ADDR_A]);
    if (existing?.alias) {
      EFFECTIVE_ALIAS_A = existing.alias;
      console.log(`  -> Wallet A already has profile "${existing.alias}" - skipping create`);
      assertNonEmpty(existing.address, "address stored");
      assertNonEmpty(existing.created_at, "created_at stored");
      const bal = await callRead(clientA, "get_balance", [ADDR_A]);
      assert(Number(bal) >= 0, "get_balance non-negative");
      results.push(`1.1 create_profile A OK (existing: ${existing.alias})`);
    } else {
      const statsB4 = await callRead(clientA, "get_protocol_stats");
      const profilesB4 = Number(statsB4?.total_profiles ?? 0);

      const r = await callWrite(clientA, "create_profile", [ALIAS_A], `A(${shortAddr(ADDR_A)})`);
      assert(r.ok, "create_profile A must succeed");

      const profile = await callRead(clientA, "get_profile", [ADDR_A]);
      assertEqual(profile?.alias, ALIAS_A, "alias matches");
      assertEqual(Number(profile?.balance), 0, "balance starts at 0");
      assertNonEmpty(profile?.address, "address stored");
      assertNonEmpty(profile?.created_at, "created_at stored");
      assertEqual(Number(profile?.caption_count), 0, "caption_count=0");
      assertEqual(Number(profile?.roast_count), 0, "roast_count=0");
      assertEqual(Number(profile?.chaos_count), 0, "chaos_count=0");
      assertEqual(Number(profile?.duel_wins), 0, "duel_wins=0");

      const statsAf = await callRead(clientA, "get_protocol_stats");
      assert(Number(statsAf?.total_profiles) === profilesB4 + 1, "total_profiles incremented");

      const bal = await callRead(clientA, "get_balance", [ADDR_A]);
      assertEqual(Number(bal), 0, "get_balance returns 0");
      results.push("1.1 create_profile A OK");
    }
  }

  {
    const existing = await callRead(clientA, "get_profile", [ADDR_B]);
    if (existing?.alias) {
      console.log(`  -> Wallet B already has profile "${existing.alias}" - skipping create`);
      results.push(`1.2 create_profile B OK (existing: ${existing.alias})`);
    } else {
      const r = await callWrite(clientB, "create_profile", [ALIAS_B], `B(${shortAddr(ADDR_B)})`);
      assert(r.ok, "create_profile B must succeed");

      const profile = await callRead(clientA, "get_profile", [ADDR_B]);
      assertEqual(profile?.alias, ALIAS_B, "alias B matches");
      results.push("1.2 create_profile B OK");
    }
  }

  {
    const promptsB4 = await callRead(clientA, "get_active_prompts");
    const countB4 = Array.isArray(promptsB4) ? promptsB4.length : 0;

    const r = await callWrite(clientA, "create_prompt", [PROMPT_TEXT], `A(${shortAddr(ADDR_A)})`);
    assert(r.ok, "create_prompt must succeed");

    const prompts = await callRead(clientA, "get_active_prompts");
    assert(Array.isArray(prompts), "get_active_prompts returns array");
    assert(prompts.length >= countB4 + 1, "prompt count increased");

    const found = prompts.find((p) => p.text === PROMPT_TEXT);
    assert(!!found, "new prompt found in active prompts");
    assertEqual(found?.active, true, "prompt.active=true");
    assertNonEmpty(found?.id, "prompt.id non-empty");
    assertEqual(found?.author?.toLowerCase(), ADDR_A.toLowerCase(), "prompt.author=Wallet A");
    promptId = found?.id;
    results.push(`1.3 create_prompt OK id=${promptId}`);
  }

  {
    const ENTRY_A = `This meme is my five-year plan S1_${TAG}`;
    const ENTRY_B = `Joining this duel with side-eye and spreadsheets S1_${TAG}`;
    const statsB4 = await callRead(clientA, "get_protocol_stats");
    const duelsB4 = Number(statsB4?.total_duels ?? 0);

    const r = await callWrite(clientA, "start_duel", [promptId, ENTRY_A], `A(${shortAddr(ADDR_A)})`);
    assert(r.ok, "start_duel must succeed");

    const statsAf = await callRead(clientA, "get_protocol_stats");
    assert(Number(statsAf?.total_duels) === duelsB4 + 1, "total_duels incremented");

    duelId = await callRead(clientA, "get_latest_duel_id", [ADDR_A]);
    assertNonEmpty(duelId, "latest duel id available");

    const duelWaiting = await callRead(clientA, "get_duel", [duelId]);
    assertEqual(duelWaiting?.status, "waiting", "duel status=waiting after start");
    assertEqual(duelWaiting?.player_a?.toLowerCase(), ADDR_A.toLowerCase(), "player_a=Wallet A");

    const rJoin = await callWrite(clientB, "join_duel", [duelId, ENTRY_B], `B(${shortAddr(ADDR_B)})`);
    assert(rJoin.ok, "join_duel must succeed");

    const duelReady = await callRead(clientA, "get_duel", [duelId]);
    assertEqual(duelReady?.status, "ready", "duel status=ready after join");
    assertEqual(duelReady?.player_b?.toLowerCase(), ADDR_B.toLowerCase(), "player_b=Wallet B");

    results.push(`1.4 start_duel+join_duel OK id=${duelId}`);
  }

  {
    const lb = await callRead(clientA, "get_leaderboard");
    assert(Array.isArray(lb), "get_leaderboard returns array");
    const entryA = lb.find((e) => e.address?.toLowerCase() === ADDR_A.toLowerCase());
    assert(!!entryA, "Wallet A on leaderboard");
    assertEqual(entryA?.alias, EFFECTIVE_ALIAS_A, "leaderboard alias correct");
    results.push(`1.5 get_leaderboard OK (${lb.length} entries)`);
  }

  console.log("\n  SUITE 1 SUMMARY:");
  for (const r of results) console.log(`    ${r}`);
  return { aliasA: ALIAS_A, aliasB: ALIAS_B, promptId, duelId };
}
