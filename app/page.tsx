"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Sticker from "@/components/ui/Sticker";

const DEMO_CONSOLE = [
  { step: "SUBMIT_CAPTION", msg: "Received", color: "#FFE600" },
  { step: "SAFETY", msg: "No unsafe class detected", color: "#35E36D" },
  { step: "GENLAYER", msg: "_review_caption invoked", color: "#0057FF" },
  { step: "VALIDATORS", msg: "Humour equivalence check running", color: "#00D8C8" },
  { step: "CONSENSUS", msg: "outcome: ABSURD_GENIUS", color: "#7A35FF" },
  { step: "CAP", msg: "requested delta +92 capped to +80", color: "#FF3B30" },
  { step: "BALANCE", msg: "+80 Jest Points applied", color: "#35E36D" },
  { step: "EVENT", msg: "ChaosFeed updated", color: "#FFE600" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF8E7] halftone-bg">
      {/* Topbar */}
      <header className="border-b-4 border-[#121212] bg-[#FFE600] px-4 py-3 flex items-center justify-between shadow-[0_4px_0px_#121212]">
        <span className="font-['Rubik_Mono_One',monospace] text-2xl text-[#121212] tracking-tight glitch">
          JESTOR
        </span>
        <div className="flex items-center gap-3">
          <Badge variant="blue">GenLayer Native</Badge>
          <Link href="/arena">
            <Button size="sm">Enter Arena</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        {/* Hero */}
        <section className="relative">
          <div className="absolute -top-4 -left-2 rotate-[-2deg]">
            <Sticker color="#FF8BD1" rotate={-3}>Meme Logic</Sticker>
          </div>
          <div className="pt-6">
            <h1 className="font-['Rubik_Mono_One',monospace] text-5xl md:text-7xl text-[#121212] leading-none mb-4">
              Meme logic,<br />
              <span className="text-[#0057FF]">judged by</span><br />
              AI consensus.
            </h1>
            <p className="text-lg text-[#6B6257] max-w-2xl leading-relaxed mb-8">
              Jestor is a GenLayer-native arena where jokes, captions, roasts, and chaos actions
              mutate internal toy balances through transparent Intelligent Contract verdicts.
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <Link href="/arena"><Button size="lg">Enter Arena</Button></Link>
              <Link href="/rules"><Button size="lg" variant="ghost">Rules & Disclaimers</Button></Link>
            </div>
            {/* Disclaimer */}
            <div className="border-2 border-dashed border-[#C99A6B] bg-white p-3 max-w-2xl">
              <p className="text-xs font-bold text-[#6B6257]">
                ⚠ Jest Points are internal toy balances for gameplay only. They are not tokens,
                not tradable, not withdrawable, and have no financial value.
              </p>
            </div>
          </div>
        </section>

        {/* Demo console card */}
        <section className="relative">
          <div className="absolute -top-3 -right-1 rotate-[1.5deg]">
            <Sticker color="#00D8C8" rotate={2}>Consensus Proof</Sticker>
          </div>
          <div className="border-4 border-[#121212] shadow-[6px_6px_0px_#121212] overflow-hidden">
            <div className="bg-[#FFE600] border-b-4 border-[#121212] px-4 py-2 flex items-center gap-2">
              <span className="font-['Rubik_Mono_One',monospace] text-sm">ACTIVE ROUND: Caption Rift #014</span>
              <Badge variant="blue" className="ml-auto">PENDING</Badge>
            </div>
            <div className="bg-[#121212] p-4 font-mono text-xs space-y-1.5">
              {DEMO_CONSOLE.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-3"
                >
                  <span className="font-black shrink-0" style={{ color: line.color }}>[{line.step}]</span>
                  <span className="text-[#D8D0BF]">{line.msg}</span>
                </motion.div>
              ))}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-[#00D8C8]"
              >█</motion.span>
            </div>
          </div>
        </section>

        {/* Modes grid */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-2xl text-[#121212] mb-6">
            // Arena Modes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: "/caption-rift", title: "Caption Rift", desc: "Submit captions to prompts. GenLayer judges humour, fit, and originality.", color: "#35E36D", sticker: "ABSURDIST" },
              { href: "/roast", title: "Roast Balance", desc: "Roast yourself. The contract decides if it's playful enough to reward.", color: "#FF3B30", sticker: "SELF-ROAST" },
              { href: "/duels", title: "Meme Duels", desc: "Two players, one prompt, GenLayer picks the winner.", color: "#7A35FF", sticker: "1v1" },
              { href: "/chaos-lab", title: "Chaos Lab", desc: "One daily chaos action. The oracle decides blessing or curse.", color: "#FF8BD1", sticker: "DAILY" },
            ].map(({ href, title, desc, color, sticker }) => (
              <Link key={href} href={href}>
                <div
                  className="border-4 border-[#121212] bg-white p-4 shadow-[4px_4px_0px_#121212] hover:shadow-[2px_2px_0px_#121212] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-['Rubik_Mono_One',monospace] text-base text-[#121212] group-hover:text-[#0057FF] transition-colors">
                      {title}
                    </span>
                    <Sticker color={color} rotate={-2} className="text-[10px]">{sticker}</Sticker>
                  </div>
                  <p className="text-sm text-[#6B6257]">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* GenLayer proof section */}
        <section className="border-4 border-[#0057FF] bg-white p-6 shadow-[6px_6px_0px_rgba(0,87,255,0.28)]">
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#0057FF] mb-4">
            Why GenLayer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#6B6257]">
            <div>
              <p className="font-black text-[#121212] mb-1">Normal contracts can't judge humour.</p>
              <p>Deterministic code can't decide if a meme is funny. GenLayer uses AI-validator consensus to make subjective judgements transparently.</p>
            </div>
            <div>
              <p className="font-black text-[#121212] mb-1">Validators agree on structured verdicts.</p>
              <p>Jestor uses fixed JSON schemas so validators reach consensus reliably — then the contract applies deterministic caps.</p>
            </div>
            <div>
              <p className="font-black text-[#121212] mb-1">Every balance change is traceable.</p>
              <p>Each verdict page shows every step inline: safety scan, GenLayer invocation, validator check, cap, and final effect.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-[#121212] bg-[#121212] text-[#D8D0BF] px-4 py-6 mt-12">
        <div className="max-w-5xl mx-auto text-xs font-mono space-y-1">
          <p className="font-black text-[#FFE600]">JESTOR — GenLayer Meme Balance Arena</p>
          <p>Jest Points are internal toy balances for gameplay and experimentation only.</p>
          <p>Not tokens. Not securities. Not investments. Not tradable. Not withdrawable. No monetary value.</p>
          <p className="text-[#6B6257]">Built on GenLayer Studionet. No external AI APIs used.</p>
        </div>
      </footer>
    </div>
  );
}
