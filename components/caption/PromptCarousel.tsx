"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Prompt } from "@/lib/genlayer/types";
import { SEED_PROMPTS } from "@/lib/jestora/prompts";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PromptCarouselProps {
  prompts: Prompt[];
  selectedId: string | null;
  onSelect: (prompt: Prompt) => void;
}

export default function PromptCarousel({ prompts, selectedId, onSelect }: PromptCarouselProps) {
  const [idx, setIdx] = useState(0);

  // Merge contract prompts + seed prompts
  const allPrompts: Prompt[] = [
    ...prompts,
    ...SEED_PROMPTS.filter((sp) => !prompts.find((p) => p.id === sp.id)).map((sp) => ({
      ...sp,
      author: "system",
      active: true,
      created_at: 0,
    })),
  ];

  if (!allPrompts.length) return <p className="text-sm text-[#6B6257]">No prompts available.</p>;

  const current = allPrompts[idx % allPrompts.length];

  return (
    <div className="space-y-2">
      <div className="relative border-4 border-[#121212] bg-[#FFF8E7] p-4 shadow-[4px_4px_0px_#121212] min-h-[80px] flex items-center">
        <p className="text-sm font-bold text-[#121212] flex-1 pr-2">{current.text}</p>
        {selectedId === current.id && (
          <div className="absolute top-2 right-2 bg-[#35E36D] border border-[#121212] px-1 text-[10px] font-black uppercase">
            Selected
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIdx((i) => (i - 1 + allPrompts.length) % allPrompts.length)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs font-mono text-[#6B6257]">{idx + 1} / {allPrompts.length}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIdx((i) => (i + 1) % allPrompts.length)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={selectedId === current.id ? "green" : "primary"}
          onClick={() => onSelect(current)}
          className="ml-auto"
        >
          {selectedId === current.id ? "✓ Selected" : "Use This Prompt"}
        </Button>
      </div>
    </div>
  );
}
