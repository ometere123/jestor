/**
 * Debug a single write tx to see the actual Python error.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const PRIVATE_KEY = "0xd94494a5e2fc489c843fff96e87c7035cf076294806ec8e3415f13eb36d16da9";
const CONTRACT = "0xe94D91d36A4Db1dEE97b3FE6f23A620824D21cD5";

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
