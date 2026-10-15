/**
 * Securely bootstraps three existing CLI-managed Studionet wallets.
 *
 * This script never generates, prints, persists, or commits private keys.
 * Supply PLAYER_IMANI_PK, PLAYER_ZOE_PK, and PLAYER_LOLA_PK from the
 * CLI-managed account store or a protected CI secret environment.
 */
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant, TransactionStatus, type CalldataEncodable } from "genlayer-js/types";
import type { Address, Hex } from "viem";

const rawAddress = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS;
if (!rawAddress) throw new Error("NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is required.");
const address = rawAddress as Address;

const requiredKeys = ["PLAYER_IMANI_PK", "PLAYER_ZOE_PK", "PLAYER_LOLA_PK"];
for (const name of requiredKeys) {
  if (!process.env[name]) throw new Error(name + " is required; this script does not generate wallet keys.");
}

const players = requiredKeys.map((name) => {
  const account = createAccount(process.env[name]! as Hex);
  return { name: name.replace("PLAYER_", "").replace("_PK", "").toLowerCase(), account, client: createClient({ chain: studionet, account }) };
});

async function read(player: typeof players[number], method: string, args: unknown[] = []) {
  return player.client.readContract({ address, functionName: method, args: args as CalldataEncodable[], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
}

async function write(player: typeof players[number], method: string, args: unknown[]) {
  const hash = await player.client.writeContract({ address, functionName: method, args: args as CalldataEncodable[], value: BigInt(0) });
  const receipt = await player.client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, retries: 180, interval: 5000 });
  const resultName = receipt.resultName ?? ({ 6: "MAJORITY_AGREE", 7: "MAJORITY_DISAGREE" } as Record<number, string>)[receipt.result as number];
  const execution = receipt.consensus_data?.leader_receipt?.[0]?.execution_result ?? receipt.txExecutionResultName;
  if (receipt.statusName !== "FINALIZED" || resultName !== "MAJORITY_AGREE" || execution !== "SUCCESS") {
    throw new Error(method + " did not produce a finalized successful majority-agree receipt.");
  }
  console.log(player.name + " " + method + " finalized: " + String(hash));
}

async function main() {
  const chainId = await players[0].client.getChainId();
  if (Number(chainId) !== 61999) throw new Error("Refusing to sign on chain " + chainId + "; expected Studionet 61999.");
  console.log("Studionet verified: chain " + chainId + "; contract " + address);
  for (const player of players) {
    const profile = await read(player, "get_profile", [player.account.address.toLowerCase()]);
    if (profile && typeof profile === "object" && Object.keys(profile).length) {
      console.log(player.name + " profile already exists at " + player.account.address + ".");
    } else {
      await write(player, "create_profile", [player.name]);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
