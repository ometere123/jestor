/**
 * Jestor end-to-end test runner.
 *
 * Usage:
 *   GL_PK1=0x... GL_PK2=0x... node scripts/test-all.mjs
 *   GL_PK1=0x... GL_PK2=0x... node scripts/test-all.mjs s1 s3   (subset)
 *
 * Reads GL_PK1 and GL_PK2 from environment. Never hardcoded.
 * Exits non-zero on first failure.
 */

import { runSanity }        from "./suites/s0_sanity.mjs";
import { runDeterministic } from "./suites/s1_deterministic.mjs";
import { runReverts }       from "./suites/s2_reverts.mjs";
import { runNonDet }        from "./suites/s3_nondet.mjs";
import { CONTRACT }         from "./lib/helpers.mjs";

const FILTER = process.argv.slice(2); // e.g. ["s1", "s3"]

function shouldRun(name) {
  return FILTER.length === 0 || FILTER.some(f => name.startsWith(f));
}

async function timed(name, fn, ctx) {
  const t0 = Date.now();
  try {
    const result = await fn(ctx ?? {});
    const s = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✅ ${name} PASSED (${s}s)\n`);
    return { ok: true, result, s };
  } catch (e) {
    const s = ((Date.now() - t0) / 1000).toFixed(1);
    console.error(`\n❌ ${name} FAILED (${s}s): ${e.message}\n`);
    if (e.stack) console.error(e.stack);
    return { ok: false, error: e.message, s };
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  JESTOR END-TO-END QA                                    ║");
  console.log(`║  Contract : ${CONTRACT}  ║`);
  console.log("║  Network  : Studionet (chainId 61999)                    ║");
  console.log(`║  Started  : ${new Date().toISOString()}             ║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const summary = [];
  let ctx = {};

  // Step 0 - always runs (sanity cannot be filtered)
  {
    const r = await timed("Step 0 - Sanity", runSanity);
    summary.push({ name: "Step 0 Sanity", ...r });
    if (!r.ok) {
      console.error("Aborting: sanity check failed.");
      process.exit(1);
    }
  }

  // Suite 1
  if (shouldRun("s1")) {
    const r = await timed("Suite 1 - Deterministic", runDeterministic, ctx);
    summary.push({ name: "Suite 1 Deterministic", ...r });
    if (!r.ok) { printSummary(summary); process.exit(1); }
    // Pass shared state (promptId) to later suites
    if (r.result?.promptId) ctx.promptId = r.result.promptId;
  }

  // Suite 2
  if (shouldRun("s2")) {
    const r = await timed("Suite 2 - Reverts", () => runReverts(ctx), ctx);
    summary.push({ name: "Suite 2 Reverts", ...r });
    if (!r.ok) { printSummary(summary); process.exit(1); }
  }

  // Suite 3
  if (shouldRun("s3")) {
    const r = await timed("Suite 3 - Non-deterministic", () => runNonDet(ctx), ctx);
    summary.push({ name: "Suite 3 Nondet", ...r });
    if (!r.ok) { printSummary(summary); process.exit(1); }
  }

  printSummary(summary);
  const anyFail = summary.some(s => !s.ok);
  process.exit(anyFail ? 1 : 0);
}

function printSummary(summary) {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  FINAL SUMMARY                                            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  for (const { name, ok, s, error } of summary) {
    const icon = ok ? "✅" : "❌";
    const note = ok ? "" : ` - ${error?.slice(0, 60)}`;
    console.log(`  ${icon} ${name.padEnd(32)} ${s}s${note}`);
  }
  console.log();
}

main().catch(e => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
