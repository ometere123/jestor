"use client";

import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { clientSafetyCheck } from "@/lib/jestora/safety";
import type { Prompt } from "@/lib/genlayer/types";

interface DuelCreateFormProps {
  onSubmit: (promptId: string, entry: string) => Promise<void>;
  isLoading: boolean;
  prompts: Prompt[];
}

export default function DuelCreateForm({ onSubmit, isLoading, prompts }: DuelCreateFormProps) {
  const [promptId, setPromptId] = useState("");
  const [entry, setEntry] = useState("");
  const [error, setError] = useState("");

  const selectedPrompt = prompts.find((p) => p.id === promptId) ?? prompts[0];

  const handleSubmit = async () => {
    setError("");
    const { safe, reason } = clientSafetyCheck(entry);
    if (!safe) { setError(reason); return; }
    if (!selectedPrompt) { setError("No approved on-chain prompts are available."); return; }
    await onSubmit(selectedPrompt.id, entry);
    setEntry("");
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-black uppercase tracking-widest text-[#6B6257] block mb-1">Choose Prompt</label>
        <select
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
          className="w-full border-2 border-[#121212] bg-white px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_#121212] focus:outline-none"
        >
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>{p.text.slice(0, 60)}...</option>
          ))}
        </select>
      </div>

      <div className="border-l-4 border-[#7A35FF] pl-3 py-1 bg-white">
        <p className="text-sm font-bold text-[#121212]">{selectedPrompt?.text ?? "No approved on-chain prompt"}</p>
      </div>

      <Textarea
        placeholder="Your duel entry. Hidden from opponent until both submit."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
        rows={3}
        maxLength={400}
        disabled={isLoading}
      />
      {error && <p className="text-xs font-bold text-[#FF3B30]">{error}</p>}

      <Button onClick={handleSubmit} disabled={isLoading || !entry.trim() || !selectedPrompt} variant="blue" className="w-full">
        {isLoading ? "Creating Duel..." : "Start Duel"}
      </Button>
    </div>
  );
}
