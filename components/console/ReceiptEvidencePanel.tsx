import type { ReceiptEvidence } from "@/lib/genlayer/client";

interface ReceiptEvidencePanelProps {
  hash: string;
  evidence: ReceiptEvidence;
}

export default function ReceiptEvidencePanel({ hash, evidence }: ReceiptEvidencePanelProps) {
  return (
    <div className="border-2 border-[#00D8C8] bg-[#121212] p-4 font-mono text-xs text-[#D8D0BF] space-y-1">
      <p className="text-[#00D8C8] font-black uppercase tracking-widest">Finalized receipt evidence</p>
      <p>transaction: {hash}</p>
      <p>finality: {evidence.finality}</p>
      <p>execution: {evidence.executionResult ?? "unknown"}</p>
      <p>consensus result: {evidence.resultName ?? "unknown"}</p>
      {evidence.consensusData !== undefined && evidence.consensusData !== null && (
        <p className="text-[#6B6257]">validator receipt data is exposed by the GenLayer receipt; UI animations are not evidence.</p>
      )}
    </div>
  );
}
