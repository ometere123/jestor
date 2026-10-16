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
| Verified corrected Arena Circuit contract | `0xb5cA3140A8aF2137BA68bD27a0a6eaBb88F79055` |
| Deployment transaction | `0xf999b11ec9ea74ad4cb41786c66150f2ab5fdbc19ea2cdd70192a5b97f7847e0` |
| Deployment receipt | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS` |
| Retrieved deployed source bytes | `94686` (raw Studionet response) |
| Retrieved source SHA-256 | `14845bd109bf472eb3c80c98fe59a1ad2dea04732f747e5cbb9f4ef5df606264` (raw) |
| Canonical source bytes | `93322` (LF-normalized) |
| Canonical source SHA-256 | `d7e9a8e9cac2261c65cf8d8bc6d88e35548608718158fd5ab30bcfe7a4f09c2f` (LF-normalized) |
| Contract source commit | `ee531742bdb98d0ac9eb1a5f0a02499244de2a21` |
| Production frontend | [jestor.vercel.app](https://jestor.vercel.app) (existing owner-managed deployment; not changed in this contract pass) |

The table above records the corrected deployment verified on Studionet. The
retrieved source is byte-for-byte identical to the deployed working-tree source
and matches after LF normalization. The corrected deployment starts a fresh
state baseline because the prior contract had no secure upgrade path; existing
historical state was not silently migrated.

The release is one cohesive state machine in
[contract/jestor_arena.py](contract/jestor_arena.py). The existing frontend is
served from the owner-managed Jestor Vercel deployment documented in
[the release evidence](docs/release-evidence.md); this corrective contract
deployment did not invoke Vercel or change that hosted build. The project owner
has manually verified an injected EIP-1193 wallet. That manual check is
distinct from the automated Playwright suite, which does not claim a live wallet
transaction unless a real provider is available.
The historical v0.2 deployment
`0x148aEB21f9ED1aD76b38EDCC8d8c845b3E1F220A` remains a reference
only. The superseded v0.4 candidate
`0x46D843ee0e405Aba61B81bb3eFF1C0D29eCD0a3C` is also historical: a second
audit found its permissionless bracket path could deadlock before materializing
the final, so it was not promoted. The previous verified v0.4 deployment
`0x2e23BBA29011dB9Fd001ce0e0A234BB90974Bbd7` and deployment transaction
`0xb4cd1e0b64e154183349e571086584b356db3f7df2bcbe9f0f323f1f851b8e0e` are
also retained as historical references. The immediately preceding verified
baseline `0x3B7106e084F89EC2B6b01C27E2ada161B0728B36` and transaction
`0x4c47d0ece42a525d098d78cf8ce17b3cd8fb3c2e27b67bb310a781eeaad4cb4d` are
historical as well. No historical records were silently migrated.

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

## Frontend navigation

The Arena shell exposes the same ten destinations in the desktop top
navigation, the full sidebar, and the responsive mobile menu:

| Label | Route |
| --- | --- |
| Dashboard | `/arena` |
| Caption Rift | `/caption-rift` |
| Roast Balance | `/roast` |
| Meme Duels | `/duels` |
| Chaos Lab | `/chaos-lab` |
| Remix Battles | `/remix` |
| Arena Circuit | `/circuit` |
| Player Career | `/career` |
| Leaderboard | `/leaderboard` |
| Rules | `/rules` |

These links come from one typed navigation definition, so labels, routes,
icons, colors, and active-route styling stay aligned across menu surfaces.
The sidebar has its own scroll region on short desktop viewports; the mobile
menu is scrollable when the available height is smaller than the ten links.

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

`sha256("JESTOR-DUEL-V4|61999|CONTRACT|JESTOR-ARENA-CIRCUIT-V4-STUDIONET|D|P|A|S|E")`

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
and badges remain consistent. The `+180` and `−50` limits count actual balance
movement, not requested rewards; partial awards, zero-floor losses, repeated
effects, and cap exhaustion are all bounded. A cross-day correction reverses
the historical balance effect without manufacturing allowance in the current
UTC day. A competitive KEEP challenge is an economic no-op; only ADJUST or
BLOCK can apply a new bounded effect.

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
npm audit --omit=dev
npm run test:e2e
npm run test:e2e:live
python -m pytest tests/direct -q
$env:PYTHONIOENCODING = "utf-8"
& "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contract/jestor_arena.py
```

The canonical local live suite uses four to six existing named CLI-managed
wallets. It switches the CLI account context for each write and never reads,
exports, prints, or stores private keys:

```powershell
$env:GL_CONTRACT = "0xb5cA3140A8aF2137BA68bD27a0a6eaBb88F79055"
$env:CLI_ARENA_ACCOUNTS = "party_a,walletA,walletB,conveyance-deployer,party_b"
node scripts/cli-wallet-smoke.mjs
```

The CLI suite refuses any chain other than 61999, checks native funding, waits
for `FINALIZED` and `MAJORITY_AGREE`, retries the same hash after receipt-RPC
failures, and rejects RPC failures as test outcomes. Its five-wallet release
run covers prompt approval, invalid references, caption, roast, chaos, remix
attribution/copy rejection, duel secrecy/replay, challenge disagreement and
correction, blocked DRAW handling, positive tournament progression, verdict
history, career, and ranked leaderboard readback. `scripts/test-all.mjs` and
`scripts/qa.mjs` are aliases for the secure-key integration runner used by the
manual GitHub job; that runner accepts private-key secrets only through the
process environment and never logs them.

GitHub Actions runs TypeScript, ESLint, frontend unit tests, Chromium browser
smoke tests, the pinned GenVM linter, Direct Mode, and the production build on
every push and pull request. The live CLI suite is manual and secret-dependent.
The Playwright live suite is explicitly gated by `JESTOR_E2E_LIVE=true` and
requires three real injected EIP-1193 accounts on chain `61999`; it fails
closed when no provider is present and never substitutes simulated wallet
transactions.

The navigation regression suite is included in
`npm run test:frontend:unit` and `tests/e2e/ui.spec.ts`. It checks the shared
ten-route definition, the existence of every App Router page, desktop
topbar/sidebar parity, mobile-menu parity, active routes, and successful local
route responses.

The recorded five-wallet live gameplay run in the release evidence targets the
previous contract address and is retained as historical integration evidence.
The corrected deployment was verified independently through a read-only
finalized receipt and deployed-source retrieval; no new multi-wallet gameplay
run is claimed for it in this corrective pass.

## Deployment and source verification

Verify the local tool and network before signing:

```powershell
node_modules\.bin\genlayer.cmd --version
node_modules\.bin\genlayer.cmd network set studionet
node_modules\.bin\genlayer.cmd network info
node_modules\.bin\genlayer.cmd account list
node_modules\.bin\genlayer.cmd deploy --contract contract/jestor_arena.py
node_modules\.bin\genlayer.cmd receipt <deployment-transaction> --status FINALIZED
node_modules\.bin\genlayer.cmd code <contract-address>
```

Deployment is accepted only when chain ID is `61999`, the deployment
receipt is `FINALIZED`, execution succeeds, consensus is
`MAJORITY_AGREE`, and retrieved source matches the intended contract
after documented newline normalization. Never expose CLI key material in logs
or documentation.

## Frontend release control

The GitHub repository and the Jestor Vercel project are intentionally kept
disconnected. The repository contains `vercel.json` with
`git.deploymentEnabled: false` as a safeguard if Git integration is ever
reintroduced; that file does not retroactively change an already-hosted
deployment. GitHub Actions contains verification jobs only and no Vercel
deploy command or deploy hook. Future frontend releases must be initiated
manually by the project owner.

## Release evidence

The final release record is maintained in
[docs/release-evidence.md](docs/release-evidence.md).
It contains the corrected contract address, deployment transaction, local and
retrieved source hashes, finalized deployment evidence, historical integration
transaction evidence, Git commit, Vercel hosting status, and explicit
limitations. Historical deployment records are not reused as evidence for the
corrected contract.
