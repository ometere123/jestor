"use client";

import { useEffect, useState } from "react";
import ArenaShell from "@/components/layout/ArenaShell";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { useWallet } from "@/lib/jestora/walletContext";
import { getActivePrompts, getRecentSubmissions, submitRemix } from "@/lib/genlayer/contract";
import type { Prompt, Submission } from "@/lib/genlayer/types";

export default function RemixPage() {
  const { address } = useWallet(); const [prompts, setPrompts] = useState<Prompt[]>([]); const [sources, setSources] = useState<Submission[]>([]); const [promptId, setPromptId] = useState(""); const [sourceId, setSourceId] = useState(""); const [text, setText] = useState(""); const [status, setStatus] = useState("");
  useEffect(() => { void getActivePrompts().then((items) => { setPrompts(items); setPromptId(items[0]?.id ?? ""); }).catch(() => {}); }, []);
  useEffect(() => { if (promptId) void getRecentSubmissions(promptId).then((items) => { setSources(items.filter((item) => item.type === "caption" || item.type === "remix")); setSourceId(items[0]?.id ?? ""); }).catch(() => {}); }, [promptId]);
  const submit = async () => { if (!address || !promptId || !sourceId || !text.trim()) return; setStatus("Independent originality judgment pending..."); try { const result = await submitRemix(address, promptId, sourceId, text); setStatus(`Finalized. Share /verdict/${result.resultId ?? result.returnValue ?? ""}`); setText(""); } catch (e: unknown) { setStatus((e as Error).message ?? "Remix rejected."); } };
  return <ArenaShell><div className="max-w-3xl mx-auto space-y-5"><div><h1 className="font-['Rubik_Mono_One',monospace] text-3xl">Remix Battles</h1><p className="text-sm text-[#6B6257] mt-2">Transform a finalized caption. Creator attribution and copied-text checks stay on-chain.</p></div><div className="border-4 border-[#35E36D] bg-white p-4 shadow-[4px_4px_0px_#121212] space-y-3"><select value={promptId} onChange={(e) => setPromptId(e.target.value)} className="w-full border-2 border-[#121212] p-2 font-mono">{prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.text}</option>)}</select><select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full border-2 border-[#121212] p-2 font-mono">{sources.map((source) => <option key={source.id} value={source.id}>{source.id.slice(0, 10)} · {source.text}</option>)}</select><Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={4} placeholder="Add a genuinely transformative remix" /><Button onClick={submit} disabled={!address || !sourceId || !text.trim()} variant="green">Submit Remix</Button>{status && <p className="text-xs font-mono text-[#6B6257]">{status}</p>}</div></div></ArenaShell>;
}
