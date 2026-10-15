import type { ConsoleTrace } from "@/lib/genlayer/types";

interface ConsensusTraceProps {
  traces: ConsoleTrace[];
}

export default function ConsensusTrace({ traces }: ConsensusTraceProps) {
  return (
    <div className="bg-[#121212] border-2 border-[#C99A6B] p-4 font-mono text-xs space-y-2">
      <p className="text-[#FFE600] font-black uppercase">Local activity log — not consensus evidence</p>
      {traces.length ? traces.map((trace, index) => <p key={index} className="text-[#D8D0BF]">[{trace.step}] {trace.message}</p>) : <p className="text-[#6B6257]">No local activity.</p>}
      <p className="text-[#6B6257]">Only a finalized receipt and authoritative chain readback prove a result.</p>
    </div>
  );
}
