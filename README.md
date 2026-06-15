# Jestor - GenLayer Meme Balance Arena

> **Riso Meme Zine** UI identity. GenLayer-native. No external AI. No financial mechanics.

---

## What Jestor Is

**Jestor** is a GenLayer-native experimental meme arena where users submit jokes, captions, roasts, and chaos actions.
A GenLayer **Intelligent Contract** (`JestoraArena`) uses AI-validator consensus to judge submissions and apply
capped mutations to internal toy balances called **Jest Points**.

Jestor is **not** a memecoin, not a DeFi product, not a token sale, and not an investment platform.
It is a playful demonstration of **non-deterministic social game logic** powered by GenLayer.

---

## Why Humour Needs Non-Deterministic Consensus

Normal smart contracts are deterministic: they execute the same way for the same inputs.
That works for token transfers and arithmetic. It does not work for humour.

Humour is subjective, context-dependent, and qualitative. No amount of deterministic code can reliably judge comedic originality.

GenLayer solves this. Its Intelligent Contracts use LLM-based AI validators that reach consensus on qualitative judgements.

Jestor uses GenLayer for:
1. Interpreting meme text and captions
2. Classifying humour style (ABSURDIST, DRY, CHAOTIC, WHOLESOME, SATIRE, META, LOW_EFFORT)
3. Detecting unsafe or harmful content
4. Judging whether a caption fits a prompt
5. Selecting structured outcomes (ABSURD_GENIUS, CLEAN_HIT, SMALL_LAUGH, etc.)
6. Mutating internal toy balances based on consensus verdicts
7. Judging duel winners
8. Approving or rejecting chaos actions

---

## What Jest Points Are (And Are Not)

Jest Points ARE: internal toy balances, gameplay scores, non-transferable (MVP), for experimentation only.

Jest Points ARE NOT: real tokens, ERC20, tradable, withdrawable, securities, investments, or financial instruments.

Never show: USD price, token chart, swap, liquidity, APY, yield, market cap, buy/sell, airdrop, or investment language.

---

## Setup Commands

```bash
cd jestor
npm install
cp .env.example .env.local
# Edit .env.local, set NEXT_PUBLIC_USE_MOCK_CONTRACT=true for local dev
npm run dev
```

---

## Environment Variables

```env
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=   # Set after deploying JestoraArena
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999      # GenLayer Studionet chain ID
NEXT_PUBLIC_GENLAYER_RPC_URL=http://localhost:4000/api
NEXT_PUBLIC_USE_MOCK_CONTRACT=false      # true for mock mode (no contract needed)
```

---

## Contract Deployment Notes

Contract is at `contract/jestor_arena.py`.

1. Start GenLayer Studionet locally
2. Deploy `contract/jestor_arena.py` via Studionet UI or CLI
3. Copy the deployed contract address to `NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS`
4. Set `NEXT_PUBLIC_USE_MOCK_CONTRACT=false`

Register these prompt IDs in Studionet (see prompt definitions in `jestor_arena.py`):
- `review_caption`
- `review_self_roast`
- `review_duel`
- `review_chaos_action`
- `review_safety`

---

## Frontend Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
```

Stack: Next.js App Router, TypeScript, Tailwind CSS, GenLayer JS, Viem, Framer Motion, Zod, Lucide React, date-fns.

---

## Safety Rules

- No targeted harassment, hate speech, self-harm encouragement, or financial claims
- Unsafe submissions are blocked by GenLayer safety classification, no balance reward
- All safety checking runs through the contract, not the frontend

---

## Demo Walkthrough

```
1. Open http://localhost:3000
2. Connect MetaMask (injected wallet)
3. Click "Enter Arena"
4. Create a profile alias
5. Go to Caption Rift → select a prompt → submit a caption
6. Watch the consensus trace: [SUBMIT_CAPTION] → [SAFETY] → [GENLAYER] → [VALIDATORS] → [CONSENSUS] → [CAP] → [BALANCE]
7. See the structured JSON verdict with humour, originality, and safety scores
8. Open Consensus Console to inspect the full trace and cap proof
9. Try Roast Balance or Chaos Lab
10. Open Rules page to verify non-financial boundaries
```

---

## Non-Financial Disclaimer

Jestor uses internal toy balances for gameplay and experimentation only.
Jest Points are not tokens, not securities, not investments, not tradable,
not withdrawable, and have no monetary value. No external AI APIs are used.
All judgement comes from GenLayer Intelligent Contract execution.
