type ValidatorState = "idle" | "running" | "consensus";

interface ValidatorMoodGridProps {
  state: ValidatorState;
}

export default function ValidatorMoodGrid({ state }: ValidatorMoodGridProps) {
  return (
    <div className="bg-[#121212] border-2 border-[#0057FF] p-3">
      <p className="text-[#0057FF] font-mono text-xs font-black uppercase tracking-widest mb-2">
        [RECEIPT] Consensus status
      </p>
      <p className="text-xs font-mono text-[#D8D0BF]">
        {state === "running" ? "Waiting for a finalized GenLayer receipt..." : state === "consensus" ? "The finalized receipt is the authoritative consensus signal." : "No transaction submitted."}
      </p>
      <p className="text-[10px] font-mono text-[#6B6257] mt-1">Individual validator names and animated moods are not shown because they are not proof.</p>
    </div>
  );
}
