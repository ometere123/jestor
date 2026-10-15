# Jestor — Arena Circuit

Jestor is a non-financial GenLayer meme arena. Players create prompts, submit captions and self-roasts, trigger a daily chaos action, enter sealed meme duels, remix finalized work, challenge one finalized verdict, and compete in four-player Arena Circuit tournaments.

Jest Points are gameplay scores only. They are non-transferable, have no monetary value, are not tokens, and cannot be withdrawn. There are no paid entries, monetary prizes, backend services, databases, or Cloudflare Workers.

## Network and release state

The target network is GenLayer Studionet:

- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Frontend: [jestor.vercel.app](https://jestor.vercel.app)

The historical v0.2 deployment was `0x148aEB21f9ED1aD76b38EDCC8d8c845b3E1F220A`. It is retained as a historical reference and is not the Arena Circuit state baseline. The verified v0.3 Arena Circuit deployment and production release are recorded below.

## What is on-chain

`contract/jestor_arena.py` is one cohesive contract. It stores bounded profiles, balances, prompts, submissions, sealed duels, challenges, tournaments, career events, seasonal standings, verdict history, and transaction-hash attestations.

### Independent judgment

Caption Rift, Roast Balance, Chaos Lab, Remix Battles, sealed-duel resolution, prompt moderation, tournament matches, and verdict challenges use `gl.vm.run_nondet_unsafe` around separate leader and validator functions. Each function executes `gl.nondet.exec_prompt` on the substantive task. The validator does not merely inspect leader JSON: it independently reassesses the untrusted prompt/content and compares material decisions under explicit tolerances.

Every AI result is schema-checked and then constrained by deterministic contract rules. Safety classes override rewards, score and reward ranges are capped, and invalid or materially disagreeing results fail rather than mutating state.

### Community Prompt Hub

`create_prompt(text)` independently moderates each player prompt, checks bounded recent context for duplicates, records the creator, expires prompts after seven days, and caps participation per wallet/game/prompt. Every game write requires an approved, unexpired prompt ID.

### Sealed Meme Duels

The client computes a domain-separated salted commitment:

`sha256("JESTOR-DUEL-V1|prompt_id|lowercase_wallet|salt|entry")`

`start_duel` and `join_duel` store commitments only. `reveal_duel_entry` verifies wallet identity, salt, entry, deadlines, one-time commitments, and replay protection. `get_duel` hides both entries until both valid reveals (or final resolution). Anyone can resolve a ready duel; missing reveals are permissionlessly forfeited after the deadline; player A can cancel an unstarted duel.

### Challenges and careers

One non-participant may challenge one finalized submission or duel during its bounded challenge window. A challenge independently rejudges the original evidence, records immutable initial/challenge history, applies one deterministic correction, and rejects repeat challenges. Career events store finalized game results and corrections; badges are derived from finalized profile statistics.

### Arena Circuit

Tournaments register exactly four unique players for one approved prompt. After the scheduled start, permissionless settlement runs two semifinal matches and then a final. Each match is independently judged, progression is deterministic, registration and tournament deadlines are bounded, and finalization writes season points and championship statistics.

### Verifiable verdict pages

`/verdict/[id]` reads the result, prompt, submissions, criteria, stored balance deltas, finality state, transaction-hash attestation, and immutable challenge history from chain state. A transaction hash is shown only when `record_transaction_hash(result_id, hash)` has been finalized; the contract cannot read the outer protocol transaction hash from inside its own execution context. Decorative validator animations are explicitly not consensus evidence.

## Contract methods

| Method | Purpose |
| --- | --- |
| `create_profile(alias)` | Register a wallet-linked career |
| `create_prompt(text)` | Moderate and publish a bounded community prompt |
| `submit_caption(prompt_id, text)` | Caption Rift independent verdict |
| `submit_roast_self(prompt_id, text)` | Safe self-roast verdict |
| `invoke_chaos_action(prompt_id, text)` | Daily bounded chaos verdict |
| `submit_remix(prompt_id, source_id, text)` | Transform a finalized caption/remix with attribution |
| `start_duel(prompt_id, commitment)` / `join_duel(...)` | Commit sealed entries |
| `reveal_duel_entry(duel_id, entry, salt)` | Reveal and verify one entry |
| `resolve_duel(duel_id)` / `cancel_duel(duel_id)` | Permissionless settlement or cancellation |
| `challenge_verdict(result_id, text)` | One bounded independent rejudgment |
| `create_tournament` / `join_tournament` | Schedule and fill a four-player circuit |
| `settle_tournament_match` | Settle a semifinal or final |
| `record_transaction_hash(result_id, hash)` | Publish a finalized transaction-hash attestation |
| `get_verdict`, `get_verdict_history`, `get_career` | Public verification and career reads |

All reads are bounded to recent or capped records. No frontend path scans unbounded contract storage.

## Wallet and safety model

The frontend signs only through an injected EIP-1193 provider. It does not generate burner wallets, store private keys in `localStorage`, use MetaMask Snaps, or depend on wallet-specific signing packages. Connect a wallet that supports the Studionet chain and switch it to chain `61999` before writing.

Required `.env.local` values:

```dotenv
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_USE_MOCK_CONTRACT=false
```

`NEXT_PUBLIC_USE_MOCK_CONTRACT` must remain `false` for production. Mock mode is only for isolated frontend development.

## Development and verification

```powershell
npm install
npm run lint
npx tsc --noEmit --pretty false
npm run build
python -m pytest tests/direct -q
$env:PYTHONIOENCODING = "utf-8"
& "$env:LOCALAPPDATA\Python\pythoncore-3.14-64\Scripts\genvm-lint.exe" contract/jestor_arena.py
```

The repository pins the local GenLayer CLI to `genlayer@0.39.1`. The contract header pins the compatible GenVM runner. Direct tests use `genlayer-test` and include adversarial bounds, invalid prompt references, sealed reveal identity/replay checks, and four-player tournament registration/read bounds.

Live smoke testing requires four to six funded test wallets supplied as environment variables. Keys are never committed or printed by the runner:

```powershell
$env:GL_CONTRACT = "0x..."
$env:GL_PK1 = "0x..."; $env:GL_PK2 = "0x..."; $env:GL_PK3 = "0x..."; $env:GL_PK4 = "0x..."
node scripts/arena-circuit-smoke.mjs
```

The runner verifies chain ID `61999` before signing, waits for `FINALIZED`, checks execution success, exercises prompt moderation, every original game, remix attribution and copy rejection, sealed commit/reveal/hidden-entry behavior, duplicate actions, one challenge, a complete tournament, public verdict state, and career readback.

## Deployment

Deployment must use the repository-local CLI and the configured Studionet network:

```powershell
node_modules\.bin\genlayer.cmd network info
node_modules\.bin\genlayer.cmd account list
node_modules\.bin\genlayer.cmd deploy --contract contract/jestor_arena.py
node_modules\.bin\genlayer.cmd receipt <deployment-transaction> --status FINALIZED
node_modules\.bin\genlayer.cmd code <contract-address>
```

The deployment source is verified by retrieving it from the network and comparing its normalized SHA-256 with `contract/jestor_arena.py`. The historical v0.2 state is not silently migrated because that deployment has no verified upgrade path; the new v0.3 address is a documented state baseline.

## Release evidence

This section is populated from finalized command output after deployment and production smoke testing:

- Arena Circuit contract: `0x0b338d42Cca6D14b7720f3B456bD315C841470Bc`
- Deployment transaction: `0xc5b366e8dbd99ed2d94b5014392c3b3abbd6ba0c946d92f34e632946398e66e5` (`FINALIZED`, result `6`, leader `SUCCESS`, `MAJORITY_AGREE`)
- Local source SHA-256: `efdd4e9c8fccf67e5dbcc242f21969f1296fda6083c05b179007426fd6f1c1d5`
- Retrieved deployed-source SHA-256: `efdd4e9c8fccf67e5dbcc242f21969f1296fda6083c05b179007426fd6f1c1d5` (55,269 normalized bytes; exact match)
- GitHub branch: [`codex/arena-circuit`](https://github.com/ometere123/jestor/tree/codex/arena-circuit); implementation commit: `448a1c3`
- Vercel project: `delealufejoel-4184s-projects/jestor`
- Vercel deployment: [`dpl_Cwghv8DeMcTE8XhHb4rXWoE6XKN1`](https://vercel.com/delealufejoel-4184s-projects/jestor/Cwghv8DeMcTE8XhHb4rXWoE6XKN1), READY production alias [`jestor.vercel.app`](https://jestor.vercel.app)
- Live integration suite: 25 finalized Studionet transactions, all `MAJORITY_AGREE`; covered four profiles, prompt moderation, invalid-reference rollback, caption, challenge and duplicate-challenge rejection, roast, chaos, remix and copy rejection, sealed duel hidden-entry/wrong-salt/replay checks, and a complete four-player tournament.
- Representative finalized live receipts: `create_prompt` `0x1da7f2371d593157f58ad6616891c1cae2cf4bff08602aabf97e9af2e3b0986c`; `submit_caption` `0xc676804927707c1556ee9a373de6e21a9919c1465755491ce369dcbab8df3f8d`; `challenge_verdict` `0xa0fa33768821770c3a933476cc2ac422419570af2e9603d2a2448fdf907c799a`; `submit_remix` `0x8cf713fa0a3c5cc5f86c2feccf677b22a1185cda9331f1df840c980362db844e`; `resolve_duel` `0x2c86476f922226533a85307a51befddee3a001996008c16581a3d6078c896022`; tournament final `settle_tournament_match` `0x02603b0be59260e36e12e897b7320851112dc46f1115aa64045f0a95c358d9cf`.
