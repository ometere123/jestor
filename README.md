# Jestor — GenLayer Meme Balance Arena

> A GenLayer Intelligent Contract that uses AI-validator consensus to judge humour, roasts, chaos actions, and meme duels. No external AI APIs. All non-deterministic logic runs on-chain.

---

## Live Demo

**App:** https://jestor.vercel.app  
**Contract:** `0x87B900cAF8f13Ee077D57aCd0C08E9b3F62002d4`  
**Network:** GenLayer Studionet (chainId 61999)  
**RPC:** `https://studio.genlayer.com/api`

---

## The Non-Deterministic Core

This is the reason Jestor needs GenLayer. Four contract functions make qualitative LLM judgements that no deterministic smart contract can replicate:

### 1. `_judge_caption` — Caption Rift
```python
gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```
Given a prompt and a user's caption, AI validators independently score:
- Humour (0–100), Originality (0–100), Prompt Fit (0–100)
- Meme style: `ABSURDIST | DRY | CHAOTIC | WHOLESOME | SATIRE | META | LOW_EFFORT`
- Outcome: `ABSURD_GENIUS | CLEAN_HIT | SMALL_LAUGH | TRY_AGAIN | TOO_DERIVATIVE | BLOCKED`
- Safety: `SAFE | UNSAFE | TARGETED_ABUSE | HATE | SEXUAL | SELF_HARM | SPAM`
- Balance delta: 0–80 Jest Points

### 2. `_judge_roast` — Roast Balance
```python
gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```
AI validators evaluate a self-roast for playfulness and safety:
- Playfulness (0–100), Humour (0–100)
- Outcome: `HUMBLE_PIE | BRUTAL_BUT_SAFE | TRY_AGAIN | BLOCKED`
- Balance delta: 0–40 Jest Points

### 3. `_judge_chaos` — Chaos Lab
```python
gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```
AI validators classify a chaos action declaration:
- Chaos class: `BLESSING | CURSE | MIRROR | CONFETTI | NULL_EVENT`
- Generates a title and flavor text from the action content
- Balance delta: −25 to +75 Jest Points

### 4. `_judge_duel` — Meme Duels
```python
gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
```
Two players submit entries to the same prompt. AI validators pick the winner:
- Winner: `A | B | DRAW | NO_CONTEST`
- Entry A score (0–100), Entry B score (0–100)
- Written reasoning
- Per-player balance deltas: winner up to +60, loser up to +10

---

## Equivalence Principle

All four judge functions use **schema validation** as the equivalence principle — not `strict_eq`. The validator function checks that the leader's output conforms to an expected JSON schema (enum membership, numeric ranges, required string fields). This ensures consensus is reached on the *structure* of the verdict, not the exact wording, which is appropriate for free-text LLM outputs.

```python
def validator_fn(leader_result: str) -> bool:
    data = json.loads(leader_result)
    return (
        isinstance(data, dict)
        and data.get("outcome") in VALID_OUTCOMES
        and 0 <= data.get("balance_delta", -1) <= 80
        and isinstance(data.get("reason"), str)
        # ... full schema check
    )
```

---

## Contract Overview

**File:** `contract/jestor_arena.py`  
**Class:** `JestoraArena(gl.Contract)`

| Method | Type | Description |
|---|---|---|
| `create_profile(alias)` | write (det) | Register a player alias on-chain |
| `create_prompt(text)` | write (det) | Submit a meme prompt |
| `submit_caption(prompt_id, caption)` | write + **nondet** | Judge a caption via AI consensus |
| `submit_roast_self(text)` | write + **nondet** | Judge a self-roast via AI consensus |
| `invoke_chaos_action(text)` | write + **nondet** | Judge a chaos action via AI consensus |
| `start_duel(prompt_id, entry)` | write (det) | Open a duel challenge |
| `join_duel(duel_id, entry)` | write (det) | Accept a duel |
| `resolve_duel(duel_id)` | write + **nondet** | Judge duel winner via AI consensus |
| `get_profile(address)` | view | Read player profile + balance |
| `get_leaderboard()` | view | Top 50 players by Jest Points |
| `get_chaos_feed(limit)` | view | Recent AI verdicts across all players |
| `get_protocol_stats()` | view | Total profiles, duels, submissions |

---

## Jest Points

Jest Points are **internal toy balances** — gameplay scores only.

- Not tokens. Not ERC20. Not tradable. Not withdrawable.
- No monetary value. No financial prizes.
- Deterministic caps enforced in contract code (never overridden by LLM):
  - Caption: max +80 | Roast: max +40 | Duel win: max +60 | Chaos: −25 to +75
  - Daily gain cap: +180 | Daily loss cap: −50

---

## Running Locally

```bash
npm install
# Create .env.local:
# NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x87B900cAF8f13Ee077D57aCd0C08E9b3F62002d4
# NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
# NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
# NEXT_PUBLIC_USE_MOCK_CONTRACT=false
npm run dev
```

Connect MetaMask to GenLayer Studionet (chainId 61999). The app has a one-click network switch button if you're on the wrong chain.

---

## Running the Test Suite

```bash
GL_PK1=0x... GL_PK2=0x... node scripts/test-all.mjs
```

Four suites:
- **s0** — Sanity: RPC reachable, both wallets funded
- **s1** — Deterministic happy path: profiles, prompts, duels, leaderboard
- **s2** — 21 revert paths: validation errors, cooldowns, duplicates
- **s3** — Non-deterministic: all 4 AI-judged functions with schema validation

---

## Stack

| Layer | Tech |
|---|---|
| Intelligent Contract | Python, `genlayer`, `gl.vm.run_nondet_unsafe` |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Wallet | MetaMask (injected), GenLayer JS SDK |
| Chain | GenLayer Studionet (chainId 61999) |
| No external AI | All LLM judgement via GenLayer validator consensus |
