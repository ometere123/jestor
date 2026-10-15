# Jestor — Arena Circuit

Jestor is a non-financial GenLayer meme arena. Players create prompts, submit
captions and self-roasts, trigger a daily chaos action, enter sealed meme
duels, remix accepted work, challenge one finalized verdict, and compete in
four-player Arena Circuit tournaments.

Jest Points are gameplay scores only. They are non-transferable, have no
monetary value, are not tokens, and cannot be withdrawn. There are no paid
entries, monetary prizes, backend services, databases, or Cloudflare Workers.

## Verified network

| Setting | Value |
| --- | --- |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| CLI | repository-local `genlayer@0.39.1` |
| GenVM linter | `genvm-linter==0.11.0` |
| Verified Arena Circuit contract | `0x619da6669ab735a0a12EaCFaA3623Ce39ec035A2` |
| Deployment transaction | `0xbcab72ffe995331bff52fd2ec2e35b7746f92887908c5de2148b9d13b5b6133c` |
| Verified source SHA-256 | `011a53ebd0c62bdc1bc639d62d2439c0fae1c3769bc66e2cfc1fb67301c4eaf3` |
| Production frontend | [jestor.vercel.app](https://jestor.vercel.app) |

The release is one cohesive state machine in
[contract/jestor_arena.py](/C:/Users/USER/Desktop/NEW%20GENLAYER%20BUILDS/jestor/contract/jestor_arena.py).
The historical v0.2 deployment
`0x148aEB21f9ED1aD76b38EDCC8d8c845b3E1F220A` remains a reference
only. It is not silently migrated: the corrected deployment is a separate
state baseline because no secure upgrade path was available.

## Eight integrations

1. Independent AI judgment for Caption Rift, Roast Balance, Chaos Lab, Remix
   Battles, sealed duels, prompt moderation, tournament matches, and verdict
   challenges.
2. Community Prompt Hub with independent approval, duplicate/originality
   checks, creator attribution, seven-day expiry, per-wallet participation
   bounds, and approved-prompt references in every game write.
3. Sealed Meme Duels with domain-separated commit/reveal, participant binding,
   deadlines, one-use commitments, hidden entries, permissionless resolution,
   cancellation before a join, and missing-reveal recovery.
4. Verdict Challenges with one non-participant challenge per finalized result,
   independent KEEP/ADJUST/BLOCK rejudgment, immutable original verdicts,
   deterministic correction, and replay-safe settlement.
5. Arena Circuit tournaments with four registered players, scheduled
   semifinals/final, challenge-window gates, deterministic season points,
   blocked/draw handling, expiry recovery, and permissionless finalization.
6. Remix Battles with source attribution, remix relationships, transformative
   originality/humour/relevance judgment, copied-content rejection, and no
   rewards or achievements for rejected remixes.
7. Verifiable Verdicts at `/verdict/[id]`. Pages read authoritative
   finalized state and bounded per-result history. An optional
   `?tx=0x...` is accepted only after the browser independently
   verifies a finalized successful majority-agree receipt that returns the
   requested result identifier.
8. Player Careers with wallet-linked finalized events, duel records, remix
   achievements, lifetime stats, bounded season standings, and derived
   non-transferable badges.

## Independent judgment model

Every decision-critical nondeterministic path has a leader call and an
independent validator call. The validator receives the original prompt/content
as untrusted data and reassesses substance; it does not merely parse or
approve leader JSON. Agreement checks include safety class, allowed/valid
status, winner, outcome bands, score thresholds, reward tolerances, challenge
decision, and tournament-relevant fields. Unsafe, malformed, internally
inconsistent, or materially disputed judgments do not mutate gameplay state.

The contract derives rewards, balance caps, winner deltas, counters, rankings,
and challenge corrections deterministically after agreement. `run_nondet_unsafe`
is an authorization boundary for an agreed decision, not a direct balance
write.

Direct Mode tests execute the leader path only, as required by the tooling.
They prove deterministic safety and state invariants. Authentic validator
agreement is demonstrated only by a finalized Studionet receipt with
consensus result `MAJORITY_AGREE`; decorative or local activity is
explicitly labeled non-evidence.

## Sealed duel protocol

For chain `61999`, logical contract domain
`JESTOR-ARENA-CIRCUIT-V4-STUDIONET`, duel ID D, prompt P, participant
A, salt S, and trimmed entry E, the commitment is:

`sha256("JESTOR-DUEL-V4|61999|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|D|P|A|S|E")`

Player A first commits with a client nonce. Player B must join before either
player can reveal. Entries remain empty in public reads until both valid
reveals or final resolution. Commitments are one-use and bound to the duel,
prompt, participant, salt, entry, chain, and protocol domain. A player can
cancel only while the duel is waiting for a join. After a join, anyone can
resolve once both reveal, or recover an expired duel after its deadline.

The browser stores only encrypted draft data: reveal text and salt are
encrypted with a non-extractable Web Crypto AES-GCM key kept in IndexedDB.
The encrypted record survives reloads, but cannot be recovered on a different
browser profile or after secure browser storage is cleared. No wallet private
key is generated or stored by the frontend.

## Challenges, balances, and careers

Balances are bounded non-financial points. Every effect is capped by game
limits, a daily gain cap, a daily loss cap, and a zero floor. A correction
reverses the originally applied actual delta before applying the corrected
effect, so daily accounting, leaderboard keys, profile counters, career events,
and badges remain consistent.

The original verdict is immutable. Challenge history is stored per result
(bounded to twelve phases), not in a latest-global-record window. A result
cannot be challenged twice, participants cannot challenge their own result,
and a correction cannot re-open or re-settle the result.

## Contract methods

| Method | Purpose |
| --- | --- |
| `create_profile(alias)` | Register a wallet-linked career |
| `create_prompt(text)` | Independently moderate and publish a prompt |
| `submit_caption(prompt_id, text)` | Caption Rift verdict |
| `submit_roast_self(prompt_id, text)` | Self-roast verdict |
| `invoke_chaos_action(prompt_id, text)` | Daily Chaos Lab verdict |
| `submit_remix(prompt_id, source_id, text)` | Attributed remix |
| `start_duel(prompt_id, commitment, client_nonce)` | Player A commit |
| `join_duel(duel_id, commitment)` | Player B commit |
| `reveal_duel_entry(duel_id, entry, salt)` | Verify one reveal |
| `resolve_duel(duel_id)` / `cancel_duel(duel_id)` | Duel recovery |
| `challenge_verdict(result_id, text)` | One bounded rejudgment |
| `create_tournament(prompt_id, starts_at)` | Schedule a circuit |
| `join_tournament(tournament_id, entry)` | Register one player |
| `settle_tournament_match(tournament_id, match_index)` | Settle a match |
| `advance_tournament(tournament_id)` | Materialize the next bracket stage after challenge windows |
| `finalize_tournament(tournament_id)` | Finalize after all gates |
| `recover_tournament(tournament_id)` | Permissionless expiry recovery |
| `get_verdict(result_id)` / `get_verdict_history(...)` | Public evidence |
| `get_career(address)` | Finalized career statistics |

There is deliberately no public transaction-hash attestation method. A
user-supplied hash is never authoritative contract state.

## Wallet and environment

The browser signs only through an injected EIP-1193 provider. It does not
generate burner wallets, store private keys in browser storage, use MetaMask
Snaps, or depend on wallet-specific signing packages. Connect a wallet that
supports Studionet and switch it to chain `61999`.

Required public variables:

```dotenv
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_USE_MOCK_CONTRACT=false
```

Production must set `NEXT_PUBLIC_USE_MOCK_CONTRACT=false`. The mock
adapter is only for isolated frontend development and is never chain evidence.

## Reproducible verification

```powershell
npm ci
npm run test:frontend:unit
npx tsc --noEmit --pretty false
npm run lint
npm run build
python -m pytest tests/direct -q
$env:PYTHONIOENCODING = "utf-8"
& "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contract/jestor_arena.py
```

The canonical secret-dependent live suite requires four to six existing
CLI-managed test wallets exposed only to the process as `GL_PK1`
through `GL_PK6`:

```powershell
$env:GL_CONTRACT = "0x..."
$env:GL_PK1 = "0x..."; $env:GL_PK2 = "0x..."
$env:GL_PK3 = "0x..."; $env:GL_PK4 = "0x..."
node scripts/arena-circuit-smoke.mjs
```

The suite refuses any chain other than 61999, checks native funding, waits for
`FINALIZED` and `MAJORITY_AGREE`, rejects RPC failures as
test outcomes, and covers prompt approval, invalid references, caption, roast,
chaos, remix attribution/copy rejection, duel secrecy/replay, one challenge,
four-player tournament progression, challenge-window gates, final settlement,
verdict history, career, and ranked leaderboard readback. `scripts/test-all.mjs`
and `scripts/qa.mjs` are aliases for this same suite.

GitHub Actions runs TypeScript, ESLint, the pinned GenVM linter, Direct Mode,
and the production build on every push and pull request. The live suite is
manual and secret-dependent.

## Deployment and source verification

Verify the local tool and network before signing:

```powershell
node_modules\.bin\genlayer.cmd --version
node_modules\.bin\genlayer.cmd network info
node_modules\.bin\genlayer.cmd account list
node_modules\.bin\genlayer.cmd deploy --contract contract/jestor_arena.py --rpc https://studio.genlayer.com/api
node_modules\.bin\genlayer.cmd receipt <deployment-transaction> --status FINALIZED
node_modules\.bin\genlayer.cmd code <contract-address> --rpc https://studio.genlayer.com/api
```

Deployment is accepted only when chain ID is `61999`, the deployment
receipt is `FINALIZED`, execution succeeds, consensus is
`MAJORITY_AGREE`, and retrieved source matches the intended contract
after documented newline normalization. Never expose CLI key material in logs
or documentation.

## Release evidence

The final release record is maintained in
[docs/release-evidence.md](/C:/Users/USER/Desktop/NEW%20GENLAYER%20BUILDS/jestor/docs/release-evidence.md).
It contains the corrected contract address, deployment transaction, local and
retrieved source hashes, finalized integration transaction evidence, Git
commit, Vercel deployment, and explicit limitations. Historical deployment
records are not reused as evidence.
