/**
 * Shared helpers for all QA suites.
 */

export const CONTRACT = "0x173803123A5B925eb5Ca5Ed10065607594f4e9f3";

// ── Formatting ────────────────────────────────────────────────────────────────

function truncate(v, n = 60) {
  const s = JSON.stringify(v);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function summarizeArgs(args) {
  return args.map(a => truncate(a, 40)).join(", ");
}

export function shortAddr(addr) {
  return addr ? `${addr.slice(0, 8)}…${addr.slice(-4)}` : "??";
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

export const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Assertions ────────────────────────────────────────────────────────────────

export class AssertionError extends Error {}

export function assert(condition, msg) {
  if (!condition) throw new AssertionError(`ASSERT FAILED: ${msg}`);
}

export function assertEqual(a, b, msg) {
  if (a !== b) throw new AssertionError(`ASSERT FAILED: ${msg} - got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
}

export function assertIn(val, allowed, msg) {
  if (!allowed.includes(val)) {
    throw new AssertionError(`ASSERT FAILED: ${msg} - "${val}" not in [${allowed.join(", ")}]`);
  }
}

export function assertInRange(val, min, max, msg) {
  const n = Number(val);
  if (isNaN(n) || n < min || n > max) {
    throw new AssertionError(`ASSERT FAILED: ${msg} - ${val} not in [${min}, ${max}]`);
  }
}

export function assertNonEmpty(val, msg) {
  if (!val || (typeof val === "string" && val.trim().length === 0)) {
    throw new AssertionError(`ASSERT FAILED: ${msg} - value is empty`);
  }
}

// ── Receipt helpers ───────────────────────────────────────────────────────────

function getLeaderReceipt(data) {
  return data?.consensus_data?.leader_receipt?.[0] ?? null;
}

function parseExecResult(data) {
  const lr = getLeaderReceipt(data);
  return lr?.execution_result ?? null; // "SUCCESS" | "ERROR" | null
}

function parseStderr(data) {
  const lr = getLeaderReceipt(data);
  const raw = lr?.genvm_result?.stderr ?? "";
  const lines = raw.trim().split("\n").filter(Boolean);
  return lines.slice(-2).join("\n");
}

// ── Write wrapper ─────────────────────────────────────────────────────────────
// Returns { hash, ok, execResult, error, ms, receipt }
// ok=true   → execResult is SUCCESS (or not ERROR)
// ok=false  → execResult is ERROR; error has last-2 lines of stderr

export async function callWrite(client, functionName, args, callerLabel) {
  const MAX = 3;
  let lastErr;

  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      const argsStr = summarizeArgs(args);
      console.log(`  → ${callerLabel} ${functionName}(${argsStr})`);
      const t0 = Date.now();

      const hash = await client.writeContract({
        address: CONTRACT,
        functionName,
        args,
        value: 0n,
      });

      const receipt = await client.waitForTransactionReceipt({
        hash,
        retries: 200,
        interval: 3000,
      });

      // Use getTransaction for the definitive consensus_data view
      let txData = receipt;
      try {
        txData = await client.getTransaction({ hash });
      } catch (_) { /* fall back to receipt */ }

      const execResult = parseExecResult(txData) ?? parseExecResult(receipt);
      const ms = Date.now() - t0;

      if (execResult === "ERROR") {
        const error = parseStderr(txData) || parseStderr(receipt);
        console.log(`  ✗ ${functionName} ERROR (${ms}ms) tx=${hash}`);
        console.log(`    stderr[-2]: ${error}`);
        return { hash, ok: false, execResult, error, ms, receipt };
      }

      console.log(`  ✓ ${functionName} (${ms}ms) tx=${hash}`);
      return { hash, ok: true, execResult, ms, receipt };

    } catch (e) {
      lastErr = e;
      if (attempt < MAX) {
        console.log(`  ⚠ attempt ${attempt} threw: ${e.message.slice(0, 100)}, retrying in 5s…`);
        await sleep(5000);
      }
    }
  }
  throw lastErr;
}

// ── Read wrapper ──────────────────────────────────────────────────────────────

export async function callRead(client, functionName, args = []) {
  return client.readContract({ address: CONTRACT, functionName, args });
}
