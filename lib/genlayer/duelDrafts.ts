"use client";

import { sha256, toBytes } from "viem";

export const ARENA_CHAIN_ID = 61999;
export const ARENA_CONTRACT_DOMAIN = "JESTOR-ARENA-CIRCUIT-V4-STUDIONET";
export const DUEL_DOMAIN = "JESTOR-DUEL-V4";
const STORAGE_KEY = "jestor:sealed-duel-drafts:v4";
const KEY_DATABASE = "jestor:sealed-duel-secrets:v1";
const KEY_STORE = "keys";
const KEY_NAME = "draft-key";

export type DuelDraftRole = "A" | "B";

export interface DuelDraft {
  version: 4;
  chainId: number;
  contract: string;
  duelId: string;
  promptId: string;
  participant: string;
  role: DuelDraftRole;
  entry: string;
  salt: string;
  commitment: string;
  clientNonce?: string;
  phase: "committed" | "joined" | "revealed";
  createdAt: number;
}

interface StoredDraft {
  version: 1;
  iv: string;
  ciphertext: string;
}

function key(contract: string, address: string, duelId: string): string {
  return [String(ARENA_CHAIN_ID), contract.toLowerCase(), address.toLowerCase(), duelId].join(":");
}

function requireBrowserCrypto(): Crypto {
  if (typeof window === "undefined" || !window.crypto?.subtle || !window.indexedDB) {
    throw new Error("Secure sealed-duel recovery requires browser Web Crypto and IndexedDB.");
  }
  return window.crypto;
}

function openKeyDatabase(): Promise<IDBDatabase> {
  requireBrowserCrypto();
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(KEY_DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(KEY_STORE)) request.result.createObjectStore(KEY_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open secure duel key storage."));
  });
}

let keyPromise: Promise<CryptoKey> | null = null;

function getStorageKey(): Promise<CryptoKey> {
  if (keyPromise) return keyPromise;
  keyPromise = openKeyDatabase().then((database) => new Promise<CryptoKey>((resolve, reject) => {
    const readTransaction = database.transaction(KEY_STORE, "readonly");
    const request = readTransaction.objectStore(KEY_STORE).get(KEY_NAME);
    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result as CryptoKey);
        return;
      }
      void window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]).then((generated) => {
        const writeTransaction = database.transaction(KEY_STORE, "readwrite");
        const put = writeTransaction.objectStore(KEY_STORE).put(generated, KEY_NAME);
        put.onsuccess = () => resolve(generated as CryptoKey);
        put.onerror = () => reject(put.error ?? new Error("Unable to persist secure duel key."));
      }).catch(reject);
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to read secure duel key."));
  }));
  keyPromise.catch(() => { keyPromise = null; });
  return keyPromise;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((value) => { binary += String.fromCharCode(value); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function encryptDraft(draft: DuelDraft): Promise<StoredDraft> {
  const crypto = requireBrowserCrypto();
  const iv: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(12));
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getStorageKey(), new TextEncoder().encode(JSON.stringify(draft)));
  return { version: 1, iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(ciphertext)) };
}

async function decryptDraft(stored: StoredDraft): Promise<DuelDraft | null> {
  try {
    const crypto = requireBrowserCrypto();
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(stored.iv) }, await getStorageKey(), fromBase64(stored.ciphertext));
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as DuelDraft;
    return parsed && parsed.version === 4 ? parsed : null;
  } catch {
    return null;
  }
}

function readStored(): Record<string, StoredDraft> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, StoredDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStored(drafts: Record<string, StoredDraft>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function randomSecret(bytes = 24): string {
  const crypto = requireBrowserCrypto();
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function duelIdFor(promptId: string, address: string, clientNonce: string): string {
  const payload = [DUEL_DOMAIN, String(ARENA_CHAIN_ID), ARENA_CONTRACT_DOMAIN, promptId, address.toLowerCase(), clientNonce].join("|");
  return sha256(toBytes(payload)).slice(2, 26);
}

export function duelCommitment(duelId: string, promptId: string, address: string, entry: string, salt: string): string {
  const payload = [DUEL_DOMAIN, String(ARENA_CHAIN_ID), ARENA_CONTRACT_DOMAIN, duelId, promptId, address.toLowerCase(), salt, entry.trim()].join("|");
  return sha256(toBytes(payload)).slice(2);
}

export function createDuelDraft(contract: string, participant: string, promptId: string, entry: string): DuelDraft {
  const clientNonce = randomSecret(24);
  const salt = randomSecret(24);
  const duelId = duelIdFor(promptId, participant, clientNonce);
  return {
    version: 4,
    chainId: ARENA_CHAIN_ID,
    contract: contract.toLowerCase(),
    duelId,
    promptId,
    participant: participant.toLowerCase(),
    role: "A",
    entry: entry.trim(),
    salt,
    commitment: duelCommitment(duelId, promptId, participant, entry, salt),
    clientNonce,
    phase: "committed",
    createdAt: Date.now(),
  };
}

export function createJoinDraft(contract: string, participant: string, duelId: string, promptId: string, entry: string): DuelDraft {
  const salt = randomSecret(24);
  return {
    version: 4,
    chainId: ARENA_CHAIN_ID,
    contract: contract.toLowerCase(),
    duelId,
    promptId,
    participant: participant.toLowerCase(),
    role: "B",
    entry: entry.trim(),
    salt,
    commitment: duelCommitment(duelId, promptId, participant, entry, salt),
    phase: "joined",
    createdAt: Date.now(),
  };
}

export async function saveDuelDraft(draft: DuelDraft): Promise<void> {
  const drafts = readStored();
  drafts[key(draft.contract, draft.participant, draft.duelId)] = await encryptDraft(draft);
  writeStored(drafts);
}

export async function getDuelDraft(contract: string, participant: string, duelId: string): Promise<DuelDraft | null> {
  const stored = readStored()[key(contract, participant, duelId)];
  if (!stored || stored.version !== 1) return null;
  const draft = await decryptDraft(stored);
  if (!draft || draft.chainId !== ARENA_CHAIN_ID || draft.contract !== contract.toLowerCase() || draft.participant !== participant.toLowerCase() || draft.duelId !== duelId) return null;
  return draft;
}

export async function markDuelDraftRevealed(draft: DuelDraft): Promise<DuelDraft> {
  const updated = { ...draft, phase: "revealed" as const };
  await saveDuelDraft(updated);
  return updated;
}

export async function removeDuelDraft(contract: string, participant: string, duelId: string): Promise<void> {
  const drafts = readStored();
  delete drafts[key(contract, participant, duelId)];
  writeStored(drafts);
}
