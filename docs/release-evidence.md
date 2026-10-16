# Arena Circuit release evidence

This file records evidence for the corrected Arena Circuit release. It is kept
with the source so a reader can reproduce the checks without treating UI
animations, submitted transaction hashes, or mock adapters as proof.

## Verified deployment

| Item | Value |
| --- | --- |
| Network | Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Local CLI | `genlayer@0.39.1` |
| GenVM linter | `genvm-linter==0.11.0` |
| Contract | `0x3B7106e084F89EC2B6b01C27E2ada161B0728B36` |
| Deployment transaction | `0x4c47d0ece42a525d098d78cf8ce17b3cd8fb3c2e27b67bb310a781eeaad4cb4d` |
| Deployment status | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS` |
| Retrieved source bytes | `93796` (raw Studionet response) |
| Retrieved source SHA-256 | `4329cf5f67e1ffb00edd98e457f2b7f261b4e8279c9f946fba858f74ba23cd40` |
| Canonical source SHA-256 | `25ac8add8adbcc9d77df40ef0437e9adafdbd89d1615a11da3e6e37802298847` (LF-normalized) |

The deployed source was retrieved from Studionet and compared with
`contract/jestor_arena.py` after normalizing CRLF/LF line endings. The
canonical LF bytes and SHA-256 matched exactly. The deployment is a new state
baseline. Earlier deployments remain historical references and were not
represented as migrated state. The immediately prior
candidate `0x46D843ee0e405Aba61B81bb3eFF1C0D29eCD0a3C` was superseded after
the second audit found that its bracket settlement path could deadlock before
materializing a final; it is not the production address.

## Local verification

The release candidate passed:

- `genvm-lint contract/jestor_arena.py`: 3 checks passed.
- `npm run test:direct`: 21 Direct Mode tests passed.
- `npm run test:frontend:unit`: 10 frontend unit tests passed, including the
  shared navigation regression tests.
- `npm run lint`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 14 Next.js routes generated.
- `npm audit --omit=dev`: passed with 0 production vulnerabilities.
- `npm run test:e2e`: 5 local browser tests passed; the real-wallet test
  remained skipped because no injected provider was available.
- `git diff --check`: passed for the release changes.

GitHub Actions run
[`38823042366`](https://github.com/ometere123/jestor/actions/runs/38823042366)
passed the static/build/lint/Direct Mode job on commit `5feda3e`. Its
secret-dependent Studionet job was intentionally skipped because repository
secrets are not configured; the live evidence below was executed locally with
five funded CLI-managed wallets, with the fifth used only as a non-participant
challenger.

After the branch was fast-forwarded into `master`, the final implementation
verification run
[`38824582569`](https://github.com/ometere123/jestor/actions/runs/38824582569)
passed the complete static/build/lint/Direct Mode job on commit `e6cc091`.
Its secret-dependent Studionet job was skipped for the same explicit
missing-secrets reason. A later documentation-only commit records the
provider-level hosting state below; the implementation evidence remains tied
to `e6cc091`.

The direct suite covers deterministic invariants and adversarial leader
outputs. Direct Mode does not itself prove validator agreement; that evidence
comes from the finalized Studionet receipts below.

The receipt relationship verifier was also exercised against caption
transaction `0x83ec2ccc2b74dc903583d5589da7a30dd98b0d1792c2b29b59f0ad0ba83cf1a9`:
the SDK read `status=7`, `MAJORITY_AGREE`, leader `SUCCESS`, target equal to
the deployed contract, and returned result id `2ed8cc64355237442e8ee0bd`.

## Historical candidate evidence (not production proof)

The following receipt tables document the earlier candidate runs retained for
audit traceability. They are not evidence for the production address above;
the final-address evidence follows below.

All hashes below were accepted only after receipt reads showed `status=7`
(`FINALIZED`), result `6` (`MAJORITY_AGREE`), and the expected leader
execution result. Negative cases were counted as passing only when the receipt
also showed a finalized contract execution error.

### Independent judgment and gameplay

| Lifecycle | Transaction | Result |
| --- | --- | --- |
| Profile setup | `0x0c77c74bcf5fbb846d4f93651b57487308aec52ec08180a195524ed99714ce15` | finalized success |
| Prompt approval | `0xf1598985d581d6df516e6a0d94b3204a10b492b6397792ee3e0c62130cb35420` | approved prompt `436ecefc71cedf930b7f9589` |
| Invalid prompt reference | `0x33edb0731bfc76c7ca2d5653ada84da8aae070812ef89c78e9078cea941296de` | finalized contract rejection |
| Caption rejection | `0x31fafaf718dd3f76391193320cd5325c1e4e56cae625f9aea91b543eb9a94fb7` | finalized majority disagreement; no state mutation |
| Accepted caption | `0x57d3ad666ba102f7433733cfeec65d2807454732dd9b4cdc33652aa03e218416` | caption `2ed8cc64355237442e8ee0bd`, delta `33` |
| Accepted roast | `0x20c53d744a776778ae78d3ea6c0d66ec1f361cfd3f418866f306985b6b336bb1` | roast `0eb426f0fa369e3de7bf5f09` |
| Finalized challenge | `0xf1acfe9bb668600ac0a994741994c46d1f03c5387984b402924cf95f2eed34e9` | immutable original plus settled correction |
| Chaos action | `0xe3ce900fc3c2e0c21afb2c9d7268c3d9a121a8c7fe548fecfe7c4949faeb4fbd` | chaos `58e080d67a6cdebc5f6f5d7f`, `CONFETTI`, delta `15` |
| Accepted remix | `0x03ee4cf8f34abe7100bf55cca40783663fee5ee51e8fdd04b90973524c8d55e0` | remix `867da21a9210f44e93d8d3f1`, delta `56` |
| Copied remix rejection | `0xb7b7e5aff78155a4ed3668791793dc62b6245ba99b053541876ab8880848d77d` | finalized contract rejection |

### Sealed duel

The first close duel intentionally produced two finalized majority
disagreements and remained unresolved, proving that disputed consensus does
not silently award a default winner. Its duel id is
`62906d53179073d761f8efad`.

The second duel completed the valid high-margin path:

| Lifecycle | Transaction |
| --- | --- |
| Start | `0x555a750fd5d7506bd48ef6be44a45109a2bc5a74f6885c1a6960e13ce2ae39e7` |
| Join | `0x08d27ca70d2614698868e01d4507c0c189088cb3a468ad45c29c1505f2afd61c` |
| Premature A reveal was rejected by contract ordering | `0x59e5efd5a8d173e3154f84ef64d484bff1a9640493ff9e010091c71d4e62d2e6` |
| A reveal | `0x32442dce03626c1cb43b5fe442224be943f6d5950f5bbd5f2d6f4368f74a2204` |
| B reveal | `0x2ea21a17e5a8939ad15685bb82bbf00c30905f6c80f6934ad4f4d8894faa06e1` |
| Permissionless resolve | `0x3e23199839eb09f58b5293c4a983bb1961c45974b417f669c8722fe88c29e3bf` |

The authoritative duel readback is finalized, both entries are visible only
after valid reveals, the winner is A, and the independent result was `85–15`
with actual deltas `60–10`.

### Tournament and career evidence

The scheduled four-player tournament is run by
`scripts/arena-circuit-smoke.mjs`. That runner waits for finalized
registration, both semifinal challenge windows, the final challenge window,
and permissionless finalization.

The first live circuit intentionally used near-identical entries. Both
semifinals settled as `DRAW`/`blocked`, and permissionless finalization
completed without a champion:

| Item | Value |
| --- | --- |
| Blocked tournament | `6626cf980c3ccbd1560cf31f` |
| Permissionless finalization | `0x424262cd6c249d690e3766b2619f20d802ebb9e5077b6e9f4ad799c99d8ac4ca` |
| Final readback | `status=blocked`, `stage=blocked`, `finalized=true`, `champion=null` |

A second circuit with distinct but moderate entries produced a finalized
`MAJORITY_DISAGREE` on a semifinal (`0xb4363e3c8ea16a6f20665a88c882889fc931af9bb0ace9b8b1af4756ce4da545`),
and the state remained unsettled. This proves close semantic disagreement
does not mutate a bracket or award a default winner.

The positive high-margin circuit on that superseded candidate was challenge-gated:

| Item | Value |
| --- | --- |
| Tournament | `4af10aad69481587c551c758` |
| Semifinal 0 | `0xa3292e000c997eb3d68e0fcaf1b30853522edb66a62ac185006aed7ccf62119f2` (`92–15`, A) |
| Semifinal 1 | `0xed2688108df5a91dca2d64c4221e03484441fa912eae4f15ccc843fac068541f2` (`92–8`, A) |

The final match and champion receipt are appended after both challenge gates
close.

## Historical final-address Studionet evidence (previous contract)

The previous release runs used the address-bound deployment
`0x2e23BBA29011dB9Fd001ce0e0A234BB90974Bbd7` and five serial CLI-managed
wallets (`party_a`, `walletA`, `walletB`, `conveyance-deployer`, and
`party_b`). The fifth wallet was not registered in the circuits and acted only
as a permissionless challenger. Every listed write was checked for
`FINALIZED`, `MAJORITY_AGREE`, and leader `SUCCESS`; finalized contract
rejections and finalized semantic disagreements are explicitly marked as
negative/no-mutation tests.

| Lifecycle | Final deployment transaction / readback |
| --- | --- |
| Four profile setup writes | `0x9e89d95487810a4e6406ea09317617baacf17ce2655599f89c140ff39e33d178`, `0xea54c5a1c36e788b3b1e46a9a16c0f15231eaeabb406d7f04cafbed7909a2cbf`, `0x9da966fdbcd08d3cf1c86b6cd3cfe3312569869e38d7549ffd4eb15fd0893f87`, `0x8f76674e6e738a4774ee52fd827e6c67fe39c5f999790fbd33aa10337c1cfac4` | finalized majority-agree success |
| Prompt approval | `0xe36740d05cf9fa0c2045e4ec99be80b6122a5bc913ec1cfc64a2688d0793a0c5` → prompt `436ecefc71cedf930b7f9589` | approved and active |
| Invalid prompt reference | `0x5cdf4a92948f3dd622b03acd1764355f08edf84e19fc0d3ced925332b3b50183` | finalized contract rejection |
| Accepted caption | `0x83ec2ccc2b74dc903583d5589da7a30dd98b0d1792c2b29b59f0ad0ba83cf1a9` → `2ed8cc64355237442e8ee0bd` | finalized, actual delta `45` |
| Accepted roast | `0xd657723a22d4b8bf88b47a454e31a25eb3de70a8a589da639c6c8ed976f612af` → `fb140ec3958f70128e224e97` | finalized, then challenged |
| Finalized challenge correction | `0x593a88d21115a7d98c4d76d5c50bcd618f006397354aac5f4a90ac5105438b90` | KEEP, immutable original preserved, actual delta `19` |
| Chaos action | `0x8bd068fce2f965660e18d79013ede8052bf4a94dd032659a3080db77faf05423` → `063de288a4e6e0b0419d4bab` | `CONFETTI`, actual delta `15` |
| Accepted remix | `0x360ebb315f754b1265a0fc8e72b11b99729d706ab310ce098ada43a56d52bc75` → `7fd72f44910b3d78c4b2b350` | attributed to caption `2ed8cc64355237442e8ee0bd`, actual delta `53` |
| Copied remix rejection | `0x05b91a226396a1271c75603483a07a8d77b05d91802d1eb559aab797e2b431a0` | finalized majority-agree contract error; no mutation |

### Final sealed duel

| Lifecycle | Transaction / readback |
| --- | --- |
| Start / Player A commit | `0xb036266f91538699d440f99e4bd7315b6dc850184e2c233f2826d97cf257ef3c` |
| Premature Player A reveal rejection | `0xcff08e531c3dab62e6f20187a96b6f2a7031c1ec5240225123535976d7b4cecd` |
| Player B join | `0x2826c5f326b8b583f3fec67117b7690547657ba0110542de3254cb6a4d895636` |
| Player A reveal | `0xee026343809977e75246ac50f0f88867066913d7f4d488073ed8efcb0790a289` |
| Player B reveal | `0x85062b7a34f7c6337bc9eecdf3752b5d5beb040a84301111ac60a17ef85c917a` |
| Permissionless resolve | `0x30166348fef8df3ff40fe4a8225613e2b6ebbb22c864bdada5775c2e48d271df` |

The final-address duel was read back as finalized and resolved after both
reveals; the pre-reveal read returned empty entries. Its commitment payload
included chain `61999`, the deployed contract address, the duel id, prompt,
participant, salt, and trimmed entry.

### Final-address blocked circuit

The first final-address circuit intentionally used a symmetric final. A
finalized semantic disagreement was retried without state mutation, then the
DRAW final was finalized as blocked. It never advanced Player A and never
created a champion:

| Item | Value |
| --- | --- |
| Tournament | `d2cea4c4aa121c2dfb84298e` |
| Create transaction | `0x46f9ad3e360e0c52c8fdef3e53d91704548f7d0d9304073040def84547d59558` |
| Finalized disagreement, unchanged state | `0x34acefc88bf727a4a237743eab9179b39776f223718f1034d85a4a786acd3de` |
| Final DRAW retry | `0x456207e5ccb95bcbc7ec9269d72eec9c7c2a221f62dabb65063767a6622f27ea` |
| Permissionless finalization | `0xabd0d9491db0ea8bd4f451b6f0ef4a76112ea78cdcd3c8611bea6ea1019fd07c` |
| Final readback | `status=blocked`, `stage=blocked`, `finalized=true`, `champion=null` |

Two additional final-address circuits exercised the same state machine. The
close final in `4af10aad69481587c551c758` was challenged by the fifth,
non-participant CLI wallet and remained a blocked DRAW:

| Item | Value |
| --- | --- |
| Tournament create | `0x62dd7970d8f7e893baf4f3336c89f17f5df5db3e1d6c66843e5af697756d3700` |
| Final settlement (DRAW) | `0x0c51a20d42fdc87e00bdfb03c8c59aa2912d5745687604fa66d6b16e253266182` |
| Final challenge | `0x0a6816f32bee336e7137163871c056621dff692a928affe684e5bcc38e4b7c47` |
| Permissionless finalization | `0x45d9825e5772e3a4307fda9eaccb33fd061e324f0dab453b420faa44fe4fc302` |
| Readback | `status=blocked`, `stage=blocked`, `finalized=true`, `champion=null` |

The address-bound circuit `8565d1743f67f773a2f51cda` also recorded finalized
semantic disagreements on three semifinal challenge submissions and a
permissionless blocked DRAW final. The retries had no state mutation:

| Item | Value |
| --- | --- |
| Tournament create | `0x63e586ca5f76af82ac52832347b60832fe9265e55fed80144c8feefa245ba700` |
| Semifinal settlements | `0xa0625d32e0ea4c1ab55436825f4a4d9f2b467d7bee1e6c91bbfe5a06f510c0607`, `0x07676897c2c32b70c6d69372cd83cbfc02756daed42d1dc900470b6e0fcdbba33` |
| Finalized disagreement retries | `0xaf7472b857f0df1da209944cf2a951824593646c67f7c7faaebe1086206d0c0b`, `0xe3e76b645e3d13da2c5508a38a5ad344ef3ccf9d4f3dd5e4508d984d6d3ef1f1`, `0x00d5c10319b01d6f183be9b41a190408cdb8aef704bea966a54a1d59ea26ffb7` |
| Final settlement / accepted final challenge | `0x1bcb22d7e1d276f155a2a7835975917466074b807e5987787bac205d4e779b15`, `0x5436045bef2330a13ec80d558718c46e3cbfebbadf447762bc23a4fcdcca2f1b` |
| Permissionless finalization | `0xf636eb7eaf910796cca3964f9a6f66c671bffbd55e140de44801d60cb3b3f44f` |
| Readback | `status=blocked`, `stage=blocked`, `finalized=true`, final `DRAW`, `challenged=true`, `champion=null` |

The finalized receipt for `0x00d5…26ffb7` had leader `SUCCESS` but
`MAJORITY_DISAGREE`; the transaction returned no state-changing result. This
is retained as evidence that a malicious or substantively inconsistent
challenge cannot force a bracket transition.

The five-wallet release run then created a high-contrast, safe-entry circuit
`555647cd5e35c3b7f923d24b` to exercise the positive path. Its semifinal
challenge attempts also produced finalized disagreement receipts without
mutation, after which the scheduled bracket progressed permissionlessly. The
final was independently judged as a decisive A win (`40/10` deterministic
final reward), and its final challenge remained safely gated until the
deadline; the finalization receipt and champion/career readback are recorded
below after the window closed.

| Item | Value |
| --- | --- |
| Tournament create | `0x748ea2c6e58b658048c732c5cdc6676e2e12f45d04da05791f04f04166441b09` |
| Four finalized joins | `0xe8bfa3135db4377fe0c94b25bc08d36e889cadd541eecf90103ae90521d5d23e`, `0x6c4788ef0608f5519d5314ec2c87f5a13be93ea0b3a72b837eb9fe44a87f9ec6`, `0x5f7f4282dda44a5058df6835eb38107d952b6d48ed5b9f1b73b0707b48d929d9`, `0x4c0134e3dceeb700b5b1f4eac3ddab45725de799ec4f8628b7db22d46ea7758c` |
| Semifinal settlements | `0xb7db5d6ce29ba4b76c3c586f16cde5e757df134765530d362419a4185ad5ea33`, `0x8401af2b1e432341ee9b36f83a9bcc0378566c75d9e0fafc158067da3938763a` |
| Finalized semifinal disagreement (receipt-verified) | `0x7e44776faabfa4728bb8dc41008bcd71a2737b4f10d60d9df2d97a274a25b289` |
| Final settlement | `0xb2994861d8c3c46f0de745792c1ae698ee64206d23194af8663cc255bf752843` |
| Finalized final disagreement (receipt-verified) | `0xbe9e7fc3a2d49ac220b0f08cade82880219ebe8106bc3b4a4ff6e4356ea97687` |
| Permissionless expiry finalization | `0x72b8b67d8ad75969707c256cfeebd9853469338371e6d2329bbe2224d99dccb2` |
| Final readback | `status=settled`, `stage=complete`, `finalized=true`, champion `0xac3ac69dc0bde389256dd6748c75817ead9286d9`, final `A`, final deltas `40/10` |
| Champion profile/career | balance `165`, `tournament_wins=1`, `tournament_finalists=1`, `tournament_match_wins=5`, badges include `ARENA_CHAMPION`, season `691` points `5` |
| Sorted leaderboard / season standings | champion wallet ranked first at `165`; season `691` ranked champion at `5` points |

The `0x72b8…dccb2` receipt was independently read as `status=7`,
`MAJORITY_AGREE`, leader `SUCCESS`, and returned the tournament identifier.
The final state, career, and leaderboard were then read through
`LATEST_FINAL`; no UI or submitted hash was used as evidence.

## Historical production frontend (previous contract)

The existing Vercel project is `delealufejoel-4184s-projects/jestor`.
Production and Preview configuration were updated through the Vercel CLI to
the contract above with chain `61999`, RPC
`https://studio.genlayer.com/api`, and
`NEXT_PUBLIC_USE_MOCK_CONTRACT=false`. The final production deployment is
`dpl_F29HX8jTtT6sg4G7fYoDMJew4wut` (`READY`), inspect URL
`https://vercel.com/delealufejoel-4184s-projects/jestor/F29HX8jTtT6sg4G7fYoDMJew4wut`,
and production alias `https://jestor.vercel.app`. HTTP smoke checks returned
200 for the homepage and a public verdict route; 14 served JavaScript bundles
contained the final contract address, Studionet RPC, chain `61999`, and
injected `window.ethereum` wallet logic. The homepage, duels, circuit, and
public verdict routes rendered in the in-app browser. The Chrome extension
provider was unavailable in this audit session, so no browser transaction was
claimed as evidence; the five-wallet CLI runs below are the authoritative live
write/readback evidence.

## Historical state and limitations

The corrected contract intentionally starts a fresh state baseline because the
old deployment had no secure upgrade/migration path. Its historical address
is preserved in the README and is not presented as migrated data.

The browser can sign only through an injected EIP-1193 provider. Encrypted
duel drafts survive reloads in the same browser profile, but cannot be
recovered after secure browser storage is cleared or in a different profile.
Decorative validator animations are never consensus evidence; public verdict
pages rely on finalized state and receipt verification.

## Current frontend release

The final corrective deployment, five-wallet Studionet evidence, authoritative
state readbacks, source hashes, and the production deployment are recorded in
the [corrected deployment manifest](deployment-manifest.md). That manifest is
the current release record; the older tables above are retained only for
historical audit traceability and do not describe the production contract.

The existing Jestor Vercel project was manually redeployed after the earlier
provider restriction was resolved. The deployment command reported `Ready` and
assigned the production alias:

| Field | Current value |
| --- | --- |
| Project | `delealufejoel-4184s-projects/jestor` |
| Deployment URL | `https://jestor-5avjq7ov5-delealufejoel-4184s-projects.vercel.app` |
| Inspect URL | `https://vercel.com/delealufejoel-4184s-projects/jestor/GGiYVHT9zyJxgdxUUHWKKEEna2v1` |
| Production alias | `https://jestor.vercel.app` |
| Control-plane result | `READY` reported by the Vercel CLI |
| Wallet verification | Project owner manually tested an injected EIP-1193 wallet |
| Automated live-browser transaction | Not claimed; no provider was available in this test environment |

The manual wallet check is user-provided evidence and is intentionally
separate from the automated Playwright suite. The repository change recorded
in this release did not initiate a Vercel deployment, promotion, or rollback.

### Historical hosting blocker (resolved)

An earlier audit observed HTTP 402 `Payment required / DEPLOYMENT_DISABLED` at
the Vercel edge while the deployment control plane still reported `READY`.
That incident is retained as historical troubleshooting evidence only. It is
not the current production status after the owner restored hosting and
manually redeployed the public app.

The production dependency audit passed with `npm audit --omit=dev` reporting
zero vulnerabilities. The live browser transaction spec remains fail-closed
on hosts without an injected EIP-1193 provider and never substitutes simulated
wallet transactions.

## Frontend release control

GitHub and Vercel remain intentionally disconnected. The repository safeguard
`vercel.json` sets `git.deploymentEnabled` to `false`; this is a future Git
integration safeguard and does not retroactively modify the currently hosted
deployment. GitHub Actions contains verification jobs only, with no Vercel
deploy command or deploy hook. Future frontend releases are manual owner
actions.
