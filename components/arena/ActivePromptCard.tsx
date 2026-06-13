import type { Prompt } from "@/lib/genlayer/types";

interface ActivePromptCardProps {
  prompt: Prompt | null;
}

export default function ActivePromptCard({ prompt }: ActivePromptCardProps) {
  return (
    <div className="relative border-4 border-[#0057FF] bg-white p-4 shadow-[4px_4px_0px_rgba(0,87,255,0.28)]">
      <div className="absolute -top-3.5 left-4 bg-[#0057FF] border-2 border-[#121212] px-2 py-0.5">
        <span className="text-xs font-black uppercase text-white tracking-widest">Active Prompt</span>
      </div>
      <p className="mt-1 text-sm font-bold text-[#121212] leading-snug">
        {prompt?.text ?? "No active prompt. Load one from Caption Rift."}
      </p>
      {prompt && (
        <p className="mt-1 text-[10px] font-mono text-[#6B6257]">ID: {prompt.id}</p>
      )}
    </div>
  );
}
