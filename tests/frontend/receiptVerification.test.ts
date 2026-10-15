import { describe, expect, it } from "vitest";
import { extractReturnValueFromReceipt, receiptEvidence, verifyFinalizedChallengeTransaction, verifyFinalizedTransaction } from "../../lib/genlayer/client";

describe("verifiable verdict evidence", () => {
  it("recognizes finalized majority-agree receipt evidence", () => {
    const receipt = {
      status: 7,
      result: 6,
      consensus_data: {
        leader_receipt: [{ execution_result: "SUCCESS" }],
        votes: { validatorA: "agree", validatorB: "agree" },
      },
    };
    const evidence = receiptEvidence(receipt);
    expect(evidence.finality).toBe("finalized");
    expect(evidence.resultName).toBe("MAJORITY_AGREE");
    expect(evidence.executionResult).toBe("SUCCESS");
  });

  it("extracts a returned result identifier from the leader receipt", () => {
    const receipt = { consensus_data: { leader_receipt: [{ execution_result: "SUCCESS", result: { payload: { readable: '"result-123"' } } }] } };
    expect(extractReturnValueFromReceipt(receipt)).toBe("result-123");
  });

  it("does not accept a forged hash without configured authoritative contract state", async () => {
    const verification = await verifyFinalizedTransaction("result-123", `0x${"1".repeat(64)}`);
    expect(verification.verified).toBe(false);
    expect(verification.reason).toMatch(/configured contract|authoritative/i);
  });

  it("does not accept a challenge hash without a finalized challenge relationship", async () => {
    const verification = await verifyFinalizedChallengeTransaction("result-123", `0x${"2".repeat(64)}`);
    expect(verification.verified).toBe(false);
    expect(verification.reason).toMatch(/configured contract|authoritative/i);
  });
});
