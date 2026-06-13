"use client";

import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { clientSafetyCheck } from "@/lib/jestora/safety";
import { logAction } from "@/lib/jestora/localCache";

const ROAST_EXAMPLES = [
  "My Jest Points are so low they filed for emotional bankruptcy.",
  "I've submitted 10 captions and the validators laughed at exactly none of them.",
  "My meme game is so derivative that even the chaos oracle went to sleep.",
];

interface RoastInputPanelProps {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

export default function RoastInputPanel({ onSubmit, isLoading }: RoastInputPanelProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const { safe, reason } = clientSafetyCheck(text);
    if (!safe) { setError(reason); return; }
    logAction("SUBMIT_ROAST", "Submitting self-roast");
    await onSubmit(text);
    setText("");
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-[#C99A6B] p-3">
        <p className="text-xs font-black uppercase text-[#C99A6B] tracking-widest mb-2">Self-roast only.</p>
        <p className="text-xs text-[#6B6257]">
          Roast yourself, your balance, your captions, or your meme choices.
          No roasting other users. No hate. No protected-class attacks.
        </p>
      </div>

      <div>
        <p className="text-xs font-bold text-[#6B6257] mb-2 uppercase tracking-wider">Examples:</p>
        {ROAST_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            onClick={() => setText(ex)}
            className="block w-full text-left text-xs font-mono text-[#6B6257] hover:text-[#121212] hover:bg-white border border-transparent hover:border-[#C99A6B] px-2 py-1 mb-1 transition-all"
          >
            "{ex}"
          </button>
        ))}
      </div>

      <Textarea
        placeholder="Roast yourself. Be playful. The safety goblin is watching."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={400}
        disabled={isLoading}
      />
      <div className="flex justify-between">
        <span className="text-[10px] font-mono text-[#6B6257]">{text.length}/400</span>
        {error && <span className="text-xs font-bold text-[#FF3B30]">{error}</span>}
      </div>

      <Button onClick={handleSubmit} disabled={isLoading || !text.trim()} className="w-full" variant="danger">
        {isLoading ? "Validators are wincing..." : "Submit Roast"}
      </Button>
    </div>
  );
}
