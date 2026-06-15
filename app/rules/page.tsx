import ArenaShell from "@/components/layout/ArenaShell";
import Badge from "@/components/ui/Badge";
import { CAPS } from "@/lib/jestora/balanceRules";

export default function RulesPage() {
  return (
    <ArenaShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <h1 className="font-['Rubik_Mono_One',monospace] text-3xl text-[#121212]">Rules</h1>
          <Badge variant="default">Non-Financial</Badge>
        </div>

        {/* Disclaimer */}
        <div className="border-4 border-[#FF3B30] bg-white p-5 shadow-[6px_6px_0px_#FF3B30]">
          <p className="font-['Rubik_Mono_One',monospace] text-lg text-[#FF3B30] mb-3">
            ⚠ Toy Balance Disclaimer
          </p>
          <p className="text-sm text-[#121212] leading-relaxed">
            Jestor uses internal toy balances called <strong>Jest Points</strong> for gameplay and experimentation only.
            Jest Points are <strong>not tokens</strong>, not securities, not investments, not tradable, not withdrawable,
            and have <strong>no monetary value</strong>. No USD price. No swap. No yield. No market cap.
            No buy/sell. No airdrop. No financial advice.
          </p>
        </div>

        {/* What GenLayer judges */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#0057FF] mb-3">What GenLayer Judges</h2>
          <div className="space-y-2 text-sm text-[#6B6257]">
            {[
              ["Caption Rift", "Humour score, originality score, prompt fit, safety class, and meme style, all judged by AI-validator consensus."],
              ["Roast Balance", "Playfulness score, safety class, and whether the roast is self-directed and harmless."],
              ["Meme Duel", "Which entry better fits the prompt based on humour, originality, safety, and creativity."],
              ["Chaos Action", "Whether the action is valid, what chaos class to assign, and what harmless toy mutation to apply."],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-3 border-l-4 border-[#0057FF] pl-3 py-1">
                <div>
                  <p className="font-black text-[#121212]">{label}</p>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Balance caps */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#35E36D] mb-3">Balance Cap Rules</h2>
          <p className="text-xs text-[#6B6257] mb-3">
            LLM outputs recommend a delta, but deterministic contract rules cap every mutation.
            The contract never allows uncapped balance changes.
          </p>
          <div className="bg-[#121212] border-2 border-[#35E36D] p-4 font-mono text-xs space-y-1">
            {[
              ["caption_reward_max", `+${CAPS.CAPTION_MAX}`],
              ["roast_reward_max", `+${CAPS.ROAST_MAX}`],
              ["duel_win_max", `+${CAPS.DUEL_WIN_MAX}`],
              ["duel_lose_max", `+${CAPS.DUEL_LOSE_MAX}`],
              ["chaos_max", `+${CAPS.CHAOS_MAX}`],
              ["chaos_min", `${CAPS.CHAOS_MIN}`],
              ["daily_gain_cap", `+${CAPS.DAILY_GAIN_CAP}`],
              ["daily_loss_cap", `${CAPS.DAILY_LOSS_CAP}`],
            ].map(([key, val]) => (
              <p key={key} className="text-[#D8D0BF]">
                <span className="text-[#00D8C8]">{key}:</span> {val} Jest Points
              </p>
            ))}
          </div>
        </section>

        {/* Safety rules */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#FF3B30] mb-3">Safety Rules</h2>
          <ul className="space-y-1 text-sm text-[#6B6257] list-disc list-inside">
            <li>No targeted harassment of real people.</li>
            <li>No hate speech or protected-class attacks.</li>
            <li>No self-harm encouragement.</li>
            <li>No sexual content involving minors.</li>
            <li>No real-world threats.</li>
            <li>No financial claims or investment language.</li>
            <li>Bad jokes are allowed. Unsafe content is not.</li>
            <li>Unsafe submissions are blocked and receive no balance reward.</li>
            <li>GenLayer validators classify safety before any balance mutation.</li>
          </ul>
        </section>

        {/* Cooldowns */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#7A35FF] mb-3">Cooldowns &amp; Limits</h2>
          <ul className="space-y-1 text-sm text-[#6B6257] list-disc list-inside">
            <li>Caption: 30-second cooldown between submissions.</li>
            <li>Roast: 60-second cooldown.</li>
            <li>Chaos action: Once per day (24-hour cooldown).</li>
            <li>Max 5 caption submissions per round per wallet.</li>
            <li>Duplicate or nearly identical submissions are rejected.</li>
            <li>Daily gain cap: {CAPS.DAILY_GAIN_CAP} Jest Points.</li>
            <li>Daily loss cap: {CAPS.DAILY_LOSS_CAP} Jest Points.</li>
          </ul>
        </section>

        {/* No external AI */}
        <section>
          <h2 className="font-['Rubik_Mono_One',monospace] text-xl text-[#C99A6B] mb-3">No External AI</h2>
          <p className="text-sm text-[#6B6257]">
            All AI judgement comes exclusively from GenLayer Intelligent Contract execution.
            Jestor does not use OpenAI, Anthropic, Gemini, or any other external AI API.
            The contract is the only source of verdicts.
          </p>
        </section>

        <div className="border-2 border-dashed border-[#C99A6B] p-4 text-xs text-[#6B6257] text-center">
          Jestora uses internal toy balances for gameplay and experimentation only.
          Jest Points are not tokens, not securities, not investments, not tradable,
          not withdrawable, and have no monetary value. The system blocks or rejects
          unsafe, hateful, threatening, sexual, self-harm, or targeted abusive content.
          Humour is reviewed for game purposes only.
        </div>
      </div>
    </ArenaShell>
  );
}
