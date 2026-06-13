"use client";

import { useState } from "react";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { clientSafetyCheck } from "@/lib/jestora/safety";
import { logAction } from "@/lib/jestora/localCache";

interface CaptionSubmitFormProps {
  promptId: string | null;
  promptText: string;
  senderAddress: string;
  onSubmit: (caption: string) => Promise<void>;
  isLoading: boolean;
}

export default function CaptionSubmitForm({
  promptId,
  promptText,
  senderAddress,
  onSubmit,
  isLoading,
}: CaptionSubmitFormProps) {
  const [caption, setCaption] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async () => {
    setLocalError("");
    const { safe, reason } = clientSafetyCheck(caption);
    if (!safe) {
      setLocalError(reason);
      return;
    }
    if (!promptId) {
      setLocalError("Select a prompt first.");
      return;
    }
    logAction("SUBMIT_CAPTION", `Submitting caption to round ${promptId}`);
    await onSubmit(caption);
    setCaption("");
  };

  return (
    <div className="space-y-3">
      {promptText && (
        <div className="border-l-4 border-[#35E36D] pl-3 py-1 bg-white">
          <p className="text-xs font-black uppercase text-[#35E36D] tracking-widest mb-1">Prompt</p>
          <p className="text-sm font-bold text-[#121212]">{promptText}</p>
        </div>
      )}

      <div>
        <Textarea
          placeholder="Write your caption here. Make it weird. Make it funny. The validators are watching."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={500}
          disabled={isLoading}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-mono text-[#6B6257]">{caption.length}/500</span>
          {localError && <span className="text-xs font-bold text-[#FF3B30]">{localError}</span>}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !caption.trim() || !promptId}
        className="w-full"
      >
        {isLoading ? "Consensus is laughing..." : "Submit to GenLayer"}
      </Button>

      <p className="text-[10px] text-[#6B6257] text-center">
        Validators will judge humour, originality, safety, and prompt fit.
        Balance mutation is capped by contract rules.
      </p>
    </div>
  );
}
