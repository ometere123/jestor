import { describe, expect, it } from "vitest";
import { duelCommitment, duelIdFor } from "../../lib/genlayer/duelDrafts";

describe("sealed duel client protocol", () => {
  const prompt = "prompt-123";
  const address = "0xAbCDef0000000000000000000000000000000001";
  const nonce = "nonce-1234567890123456";
  const duel = duelIdFor(prompt, address, nonce);

  it("matches the canonical chain/domain duel id vector", () => {
    expect(duel).toBe("1298155be0fc5c7c5068e7e2");
  });

  it("binds commitments to duel, prompt, participant, salt, and trimmed entry", () => {
    const commitment = duelCommitment(duel, prompt, address, "  hello  ", "salt-12345678");
    expect(commitment).toBe("33a9007da8f819ba0cf9194ce279044414a72aa7c055c171b56994a67f96d06e");
    expect(duelCommitment(duel, prompt, address, "different", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment("other-duel", prompt, address, "hello", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment(duel, prompt, "0x0000000000000000000000000000000000000002", "hello", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment(duel, prompt, address, "hello", "salt-87654321")).not.toBe(commitment);
  });

  it("binds duel ids to the initiating wallet and client nonce", () => {
    expect(duelIdFor(prompt, address, "nonce-2234567890123456")).not.toBe(duel);
    expect(duelIdFor(prompt, "0x0000000000000000000000000000000000000002", nonce)).not.toBe(duel);
  });
});
