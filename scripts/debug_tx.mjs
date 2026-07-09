/**
 * Debug a single write tx to see the actual Python error.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const PRIVATE_KEY = process.env.GL_PK1;
const CONTRACT = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS ?? process.env.GL_CONTRACT;

if (!PRIVATE_KEY) {
  throw new Error("Missing GL_PK1. Example: GL_PK1=0x... GL_CONTRACT=0x... node scripts/debug_tx.mjs");
}
if (!CONTRACT) {
  throw new Error("Missing GL_CONTRACT or NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS.");
}

async function main() {
  const account = createAccount(PRIVATE_KEY);
  const client = createClient({ chain: studionet, account });
  const addr = account.address;
  console.log("Wallet:", addr);

  // Try create_profile and get full debug info
  console.log("\nSending create_profile...");
  const hash = await client.writeContract({
    address: CONTRACT,
    functionName: "create_profile",
    args: ["DebugTester"],
    value: BigInt(0),
  });
  console.log("tx hash:", hash);

  console.log("Waiting for receipt...");
  const receipt = await client.waitForTransactionReceipt({
    hash,
    retries: 60,
    interval: 5000,
  });

  console.log("\n=== FULL RECEIPT ===");
  console.log(JSON.stringify(receipt, null, 2));

  // Try debug trace
  console.log("\n=== DEBUG TRACE ===");
  try {
    const trace = await client.debugTraceTransaction({ hash });
    console.log("result_code:", trace.result_code);
    console.log("stdout:", trace.stdout);
    console.log("stderr:", trace.stderr);
    console.log("return_data:", trace.return_data);
    if (trace.genvm_log) {
      console.log("genvm_log:", JSON.stringify(trace.genvm_log, null, 2));
    }
  } catch (e) {
    console.log("debugTrace failed:", e.message);
  }
}

main().catch(console.error);
