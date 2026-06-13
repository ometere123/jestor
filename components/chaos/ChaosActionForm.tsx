"use client";

import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { clientSafetyCheck } from "@/lib/jestora/safety";
import { logAction } from "@/lib/jestora/localCache";

const CHAOS_EXAMPLES = [
  "Rename my rank using only pirate energy.",
  "Convert today's mood into a meme prophecy.",
  "Bless my score with a nonsensical validator omen.",
  "Make my balance more dramatic but not more valuable.",
  "Summon a chaos sticker for surviving this many bad captions.",
];

interface ChaosActionFormProps {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
  hasUsedToday: boolean;
}

export default function ChaosActionForm({ onSubmit, isLoading, hasUsedToday }: ChaosActionFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const { safe, reason } = clientSafetyCheck(text);
    if (!safe) { setError(reason); return; }
    logAction("INVOKE_CHAOS", "Invoking chaos action");
    await onSubmit(text);
    setText("");
  };

  if (hasUsedToday) {
    return (
      <div className="border-4 border-dashed border-[#FF8BD1] p-6 text-center">
        <p className="text-2xl mb-2">🌀</p>
        <p className="font-['Rubik_Mono_One',monospace] text-lg text-[#121212]">CHAOS CONSUMED</p>
        <p className="text-sm text-[#6B6257] mt-2">One chaos action per day. Come back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-1">
        <p className="text-xs font-black uppercase text-[#6B6257] tracking-wider mb-1">Example Actions:</p>
        {CHAOS_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setText(ex)}
            className="text-left text-xs font-mono text-[#6B6257] hover:text-[#121212] hover:bg-white border border-transparent hover:border-[#FF8BD1] px-2 py-1 transition-all"
          >
            "{ex}"
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Describe your chaos action. The oracle will judge it."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={300}
        disabled={isLoading}
      />
      {error && <p className="text-xs font-bold text-[#FF3B30]">{error}</p>}

      <Button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="w-full" style={{ backgroundColor: "#FF8BD1" }}>
        {isLoading ? "Chaos is processing..." : "Invoke Chaos Action"}
      </Button>

      <p className="text-[10px] text-center text-[#6B6257]">One chaos action per day. Chaos sticker applied.</p>
    </div>
  );
}
