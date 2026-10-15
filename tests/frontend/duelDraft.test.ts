import { describe, expect, it } from "vitest";
import { duelCommitment, duelIdFor } from "../../lib/genlayer/duelDrafts";

describe("sealed duel client protocol", () => {
  const prompt = "prompt-123";
  const contract = "0x00000000000000000000000000000000000000c1";
  const address = "0xAbCDef0000000000000000000000000000000001";
  const nonce = "nonce-1234567890123456";
  const duel = duelIdFor(contract, prompt, address, nonce);

  it("matches the canonical chain/domain duel id vector", () => {
    expect(duel).toBe("54a553e44b22f36c00e401e2");
  });

  it("binds commitments to duel, prompt, participant, salt, and trimmed entry", () => {
    const commitment = duelCommitment(contract, duel, prompt, address, "  hello  ", "salt-12345678");
    expect(commitment).toBe("24643bc40a29063d17757fb1605016054477a9d97851223075acb5cdb4e68251");
    expect(duelCommitment(contract, duel, prompt, address, "different", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment(contract, "other-duel", prompt, address, "hello", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment(contract, duel, prompt, "0x0000000000000000000000000000000000000002", "hello", "salt-12345678")).not.toBe(commitment);
    expect(duelCommitment(contract, duel, prompt, address, "hello", "salt-87654321")).not.toBe(commitment);
    expect(duelCommitment("0x00000000000000000000000000000000000000c2", duel, prompt, address, "hello", "salt-12345678")).not.toBe(commitment);
  });

  it("binds duel ids to the initiating wallet and client nonce", () => {
    expect(duelIdFor(contract, prompt, address, "nonce-2234567890123456")).not.toBe(duel);
    expect(duelIdFor(contract, prompt, "0x0000000000000000000000000000000000000002", nonce)).not.toBe(duel);
    expect(duelIdFor("0x00000000000000000000000000000000000000c2", prompt, address, nonce)).not.toBe(duel);
  });
});
