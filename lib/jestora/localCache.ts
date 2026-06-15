"use client";

// Local session cache for recent verdicts and console traces.
// Stored in sessionStorage only, cleared on tab close.

import type { ConsoleTrace } from "../genlayer/types";

const TRACES_KEY = "jestor_console_traces";
const LAST_VERDICT_KEY = "jestor_last_verdict";

export function pushTrace(trace: ConsoleTrace): void {
  if (typeof window === "undefined") return;
  const raw = sessionStorage.getItem(TRACES_KEY);
  const traces: ConsoleTrace[] = raw ? JSON.parse(raw) : [];
  traces.push(trace);
  if (traces.length > 100) traces.splice(0, traces.length - 100);
  sessionStorage.setItem(TRACES_KEY, JSON.stringify(traces));
}

export function getTraces(): ConsoleTrace[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(TRACES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearTraces(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TRACES_KEY);
}

export function saveLastVerdict(verdict: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_VERDICT_KEY, JSON.stringify(verdict));
}

export function getLastVerdict(): unknown {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LAST_VERDICT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logAction(step: string, message: string): void {
  pushTrace({ step, message, ts: Date.now() });
}
