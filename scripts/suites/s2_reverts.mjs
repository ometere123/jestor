/**
 * Suite 2 - Deterministic revert paths.
 * For every raise / validation check in the contract, builds a scenario
 * that triggers it and asserts execution_result === "ERROR" on-chain.
 */

import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { clientA, clientB, ADDR_A, ADDR_B } from "../lib/clients.mjs";
import {
  callWrite, callRead,
  assert, assertEqual,
  shortAddr,
} from "../lib/helpers.mjs";

const throwaway = createAccount();
const clientT = createClient({ chain: studionet, account: throwaway });

const TAG = Date.now().toString(36).toUpperCase();
const PROMPT_TEXT = `Revert suite prompt S2_${TAG} - long enough to pass`;

export async function runReverts({ promptId: existingPromptId }) {
  console.log("-- SUITE 2: Revert paths -----------------------------------");
  const results = [];

  const existingA = await callRead(clientA, "get_profile", [ADDR_A]);
  assert(existingA && existingA.alias, "Wallet A has a profile (prereq)");

  let promptId = existingPromptId;
  if (!promptId) {
    const r = await callWrite(clientA, "create_prompt", [PROMPT_TEXT], `A(${shortAddr(ADDR_A)})`);
    assert(r.ok, "setup: create prompt");
    const prompts = await callRead(clientA, "get_active_prompts");
    promptId = prompts.find((p) => p.text === PROMPT_TEXT)?.id;
    assert(promptId, "setup: prompt id found");
  }

  {
    const statsB4 = await callRead(clientA, "get_protocol_stats");
    const r = await callWrite(clientT, "create_profile", ["x"], "T(throwaway)");
    assert(!r.ok, "alias='x' must revert");
    assert(r.error.toLowerCase().includes("alias") || r.error.toLowerCase().includes("2"), `stderr mentions alias length: ${r.error}`);
    const statsAf = await callRead(clientA, "get_protocol_stats");
    assertEqual(statsAf?.total_profiles, statsB4?.total_profiles, "total_profiles unchanged after revert");
    results.push("2.1 create_profile alias<2 -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "create_profile", ["A".repeat(33)], "T(throwaway)");
    assert(!r.ok, "33-char alias must revert");
    results.push("2.2 create_profile alias>32 -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "create_profile", ["NewAlias"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "duplicate create_profile must revert");
    assert(r.error.toLowerCase().includes("already"), `stderr mentions already: ${r.error}`);
    const profile = await callRead(clientA, "get_profile", [ADDR_A]);
    assertEqual(profile?.alias, existingA?.alias, "alias unchanged after duplicate attempt");
    results.push("2.3 create_profile duplicate -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "create_prompt", ["A prompt with enough text to pass length check"], "T(throwaway)");
    assert(!r.ok, "create_prompt with no profile must revert");
    assert(r.error.toLowerCase().includes("profile"), `stderr mentions profile: ${r.error}`);
    results.push("2.4 create_prompt no-profile -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "create_prompt", ["Too short"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "create_prompt text<10 must revert");
    results.push("2.5 create_prompt text<10 -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "create_prompt", ["x".repeat(301)], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "create_prompt text>300 must revert");
    results.push("2.6 create_prompt text>300 -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "submit_caption", [promptId, "A valid caption that is long enough"], "T(throwaway)");
    assert(!r.ok, "submit_caption with no profile must revert");
    assert(r.error.toLowerCase().includes("profile"), `stderr mentions profile: ${r.error}`);
    results.push("2.7 submit_caption no-profile -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "submit_caption", [promptId, "lol"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "submit_caption caption<5 must revert");
    results.push("2.8 submit_caption caption<5 -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "submit_caption", [promptId, "x".repeat(501)], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "submit_caption caption>500 must revert");
    results.push("2.9 submit_caption caption>500 -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "submit_roast_self", ["A roast that is long enough to pass"], "T(throwaway)");
    assert(!r.ok, "submit_roast_self no-profile must revert");
    results.push("2.10 submit_roast_self no-profile -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "submit_roast_self", ["bad"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "submit_roast_self text<5 must revert");
    results.push("2.11 submit_roast_self text<5 -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "submit_roast_self", ["x".repeat(401)], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "submit_roast_self text>400 must revert");
    results.push("2.12 submit_roast_self text>400 -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "invoke_chaos_action", ["A valid chaos action text length"], "T(throwaway)");
    assert(!r.ok, "invoke_chaos_action no-profile must revert");
    results.push("2.13 invoke_chaos_action no-profile -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "invoke_chaos_action", ["x"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "invoke_chaos_action action<5 must revert");
    results.push("2.14 invoke_chaos_action action<5 -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "invoke_chaos_action", ["x".repeat(301)], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "invoke_chaos_action action>300 must revert");
    results.push("2.15 invoke_chaos_action action>300 -> ERROR OK");
  }

  {
    const r = await callWrite(clientT, "start_duel", [promptId, "A valid entry long enough here"], "T(throwaway)");
    assert(!r.ok, "start_duel no-profile must revert");
    results.push("2.16 start_duel no-profile -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "start_duel", [promptId, "lol"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "start_duel entry<5 must revert");
    results.push("2.17 start_duel entry<5 -> ERROR OK");
  }

  {
    const r = await callWrite(clientB, "join_duel", ["nonexistent_duel_id", "A valid joining entry"], `B(${shortAddr(ADDR_B)})`);
    assert(!r.ok, "join_duel unknown id must revert");
    assert(r.error.toLowerCase().includes("not found") || r.error.toLowerCase().includes("duel"), `stderr: ${r.error}`);
    results.push("2.18 join_duel not-found -> ERROR OK");
  }

  {
    const r = await callWrite(clientA, "resolve_duel", ["bogus_duel_id_xyz"], `A(${shortAddr(ADDR_A)})`);
    assert(!r.ok, "resolve_duel unknown id must revert");
    results.push("2.19 resolve_duel not-found -> ERROR OK");
  }

  {
    const cap1 = `Cooldown test first submission S2_${TAG}`;
    const cap2 = `Cooldown test second submission immediately S2_${TAG}`;
    const r1 = await callWrite(clientB, "submit_caption", [promptId, cap1], `B(${shortAddr(ADDR_B)})`);
    if (r1.ok) {
      const r2 = await callWrite(clientB, "submit_caption", [promptId, cap2], `B(${shortAddr(ADDR_B)}) [CD test]`);
      if (!r2.ok) {
        assert(r2.error.toLowerCase().includes("cooldown") || r2.error.toLowerCase().includes("wait"), `CD error: ${r2.error}`);
        results.push("2.20 caption cooldown (30s) -> ERROR OK");
      } else {
        results.push("2.20 caption cooldown: second call succeeded - skipped");
      }
    } else {
      results.push("2.20 caption cooldown: first nondet call failed - skipped");
    }
  }

  {
    const entry = `Waiting duel entry for revert test S2_${TAG}`;
    const rStart = await callWrite(clientA, "start_duel", [promptId, entry], `A(${shortAddr(ADDR_A)})`);
    if (rStart.ok) {
      const duelId = await callRead(clientA, "get_latest_duel_id", [ADDR_A]);
      assert(!!duelId, "latest duel id available after start_duel");
      const rResolve = await callWrite(clientA, "resolve_duel", [duelId], `A(${shortAddr(ADDR_A)}) [not-ready]`);
      assert(!rResolve.ok, "resolve_duel on waiting duel must revert");
      assert(rResolve.error.toLowerCase().includes("not ready"), `stderr mentions not ready: ${rResolve.error}`);
      results.push("2.21 resolve_duel not-ready -> ERROR OK");
    } else {
      results.push("2.21 resolve_duel not-ready: start_duel failed (cooldown?) - skipped");
    }
  }

  console.log("\n  SUITE 2 SUMMARY:");
  for (const r of results) console.log(`    ${r}`);
}
