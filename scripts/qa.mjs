/**
 * Backwards-compatible QA entry point.
 *
 * The canonical suite is the finalized multi-wallet Arena Circuit smoke
 * runner. Keeping this alias prevents old release instructions from silently
 * exercising the obsolete v0.3 method signatures.
 */
import { runSmoke } from "./arena-circuit-smoke.mjs";

runSmoke().catch((error) => {
  console.error("QA failed: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
