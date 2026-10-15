/**
 * Deploy JestoraArena contract to Studionet.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const PRIVATE_KEY = process.env.GL_DEPLOY_PK ?? process.env.GL_PK1;
if (!PRIVATE_KEY) {
  throw new Error("Missing GL_DEPLOY_PK or GL_PK1. Example: GL_DEPLOY_PK=0x... node scripts/deploy.mjs");
}

const __dir = dirname(fileURLToPath(import.meta.url));
const contractCode = readFileSync(join(__dir, "../contract/jestor_arena.py"), "utf8");

async function main() {
  const account = createAccount(PRIVATE_KEY);
  const client = createClient({ chain: studionet, account });
  const chainId = await client.getChainId();
  if (Number(chainId) !== 61999) throw new Error("Refusing to deploy on chain " + chainId + "; expected Studionet 61999.");
  console.log("Deploying from:", account.address);
  console.log("Studionet chain verified:", chainId);
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
    status: "FINALIZED",
    retries: 60,
    interval: 5000,
    fullTransaction: true,
  });

  const resultName = receipt?.resultName ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" }[receipt?.result]);
  const execution = receipt?.consensus_data?.leader_receipt?.[0]?.execution_result ?? receipt?.txExecutionResultName;
  const finalized = receipt?.statusName === "FINALIZED" || receipt?.status === 7;
  if (!finalized || resultName !== "MAJORITY_AGREE" || execution !== "SUCCESS") {
    throw new Error("Deployment did not produce a finalized successful majority-agree receipt.");
  }

  const contractAddr = receipt?.data?.contractAddress ?? receipt?.contractAddress ?? receipt?.to_address;
  if (!contractAddr) throw new Error("Finalized deployment receipt did not expose contractAddress; use the CLI receipt command for the authoritative address.");
  console.log("\n✅ Contract deployed!");
  console.log("Address:", contractAddr);
  console.log("Deployment receipt: FINALIZED / MAJORITY_AGREE / SUCCESS");
  console.log("\nUpdate .env.local only after retrieving and hashing deployed source:");
  console.log(`NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=${contractAddr}`);
}

main().catch(console.error);
