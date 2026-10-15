/**
 * Canonical live release runner.
 *
 * The former suite split duplicated protocol assumptions and silently treated
 * non-final or RPC-failed transactions as test results. The v4 runner is one
 * stateful, adversarial journey so every read is tied to a finalized write.
 */
import { runSmoke } from "./arena-circuit-smoke.mjs";

runSmoke().catch((error) => {
  console.error("Live release suite failed: " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
