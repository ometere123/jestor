/**
 * Deploy JestoraArena contract to Studionet.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const PRIVATE_KEY = "0xd94494a5e2fc489c843fff96e87c7035cf076294806ec8e3415f13eb36d16da9";
const __dir = dirname(fileURLToPath(import.meta.url));
const contractCode = readFileSync(join(__dir, "../contract/jestor_arena.py"), "utf8");

async function main() {
  const account = createAccount(PRIVATE_KEY);
  const client = createClient({ chain: studionet, account });
  console.log("Deploying from:", account.address);
  console.log("Contract size:", contractCode.length, "chars");

  console.log("\nDeploying...");
  const hash = await client.deployContract({
    code: contractCode,
    args: [],
  });
  console.log("Deploy tx:", hash);

  console.log("Waiting for finalization...");
  const receipt = await client.waitForTransactionReceipt({
    hash,
    retries: 60,
    interval: 5000,
  });

  const contractAddr = receipt?.data?.contractAddress ?? receipt?.to_address ?? "(check receipt)";
  console.log("\n✅ Contract deployed!");
  console.log("Address:", contractAddr);
  console.log("\nUpdate .env.local:");
  console.log(`NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddr}`);

  if (!contractAddr || contractAddr === "(check receipt)") {
    console.log("\nFull receipt (find contractAddress):");
    console.log(JSON.stringify(receipt, null, 2));
  }
}

main().catch(console.error);
