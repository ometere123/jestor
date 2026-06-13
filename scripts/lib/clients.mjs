/**
 * Creates GenLayer clients from env vars GL_PK1 and GL_PK2.
 * Aborts with a clear message if either is missing.
 */

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`\nMISSING ENV VAR: ${name}`);
    console.error(`Set it before running: ${name}=0x... node scripts/test-all.mjs\n`);
    process.exit(1);
  }
  return v;
}

const pk1 = requireEnv("GL_PK1");
const pk2 = requireEnv("GL_PK2");

export const accountA = createAccount(pk1);
export const accountB = createAccount(pk2);

export const clientA = createClient({ chain: studionet, account: accountA });
export const clientB = createClient({ chain: studionet, account: accountB });

export const ADDR_A = accountA.address;
export const ADDR_B = accountB.address;
