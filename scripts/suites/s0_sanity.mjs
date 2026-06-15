/**
 * Step 0 - Sanity check.
 * Verifies RPC is reachable and both wallets have native token balance.
 */

import { clientA, clientB, ADDR_A, ADDR_B } from "../lib/clients.mjs";
import { callRead, shortAddr } from "../lib/helpers.mjs";

export async function runSanity() {
  console.log("\n── STEP 0: Sanity ──────────────────────────────────────────");

  // 1. RPC reachable - read contract stats
  let stats;
  try {
    stats = await callRead(clientA, "get_protocol_stats");
    console.log(`  ✓ RPC reachable. protocol_stats: ${JSON.stringify(stats)}`);
  } catch (e) {
    throw new Error(`RPC unreachable or contract missing: ${e.message}`);
  }

  // 2. Native balance check for both wallets
  for (const [label, client, addr] of [["A", clientA, ADDR_A], ["B", clientB, ADDR_B]]) {
    let bal;
    try {
      bal = await client.getBalance({ address: addr });
    } catch (e) {
      throw new Error(`Could not read native balance for wallet ${label}: ${e.message}`);
    }
    console.log(`  Wallet ${label} (${shortAddr(addr)}) native balance: ${bal}`);
    if (bal === 0n) {
      throw new Error(`Wallet ${label} (${addr}) has zero native balance - fund it on Studionet before running tests.`);
    }
  }

  // 3. Read current Jest Point balances (informational only)
  for (const [label, addr] of [["A", ADDR_A], ["B", ADDR_B]]) {
    const jpBal = await callRead(clientA, "get_balance", [addr]);
    console.log(`  Wallet ${label} Jest Points balance: ${jpBal}`);
  }

  console.log("  ✓ Step 0 passed\n");
}
