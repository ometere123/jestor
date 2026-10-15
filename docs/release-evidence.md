# Arena Circuit release evidence

This file records evidence for the audited Arena Circuit release. It is kept
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
| Contract | `0x2e23BBA29011dB9Fd001ce0e0A234BB90974Bbd7` |
| Deployment transaction | `0xb4cd1e0b64e154183349e571086584b356db3f7df2bcbe9f0f323f1f851b8e0e` |
| Deployment status | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS` |
| Contract source bytes | `86371` |
| Contract source SHA-256 | `e6311c8981396a29e7e9ff839818043661d3bff8a0a8fbdaa42086b39fa2d48f` |

The deployed source was retrieved from Studionet and compared byte-for-byte
with `contract/jestor_arena.py`; both the byte count and SHA-256 matched. The
deployment is a new state baseline. Earlier deployments remain historical
references and were not represented as migrated state. The immediately prior
candidate `0x46D843ee0e405Aba61B81bb3eFF1C0D29eCD0a3C` was superseded after
the second audit found that its bracket settlement path could deadlock before
materializing a final; it is not the production address.

## Local verification

The release candidate passed:

- `genvm-lint contract/jestor_arena.py`: 3 checks passed.
- `npm run test:direct`: 13 Direct Mode tests passed.
- `npm run lint`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 14 Next.js routes generated.
- `git diff --check`: passed for the release changes.

The direct suite covers deterministic invariants and adversarial leader
outputs. Direct Mode does not itself prove validator agreement; that evidence
comes from the finalized Studionet receipts below.

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

## Final-address Studionet evidence

The final release run used the address-bound deployment
`0x2e23BBA29011dB9Fd001ce0e0A234BB90974Bbd7` and four serial CLI-managed
wallets (`party_a`, `walletA`, `walletB`, and `conveyance-deployer`). Every
listed write was checked for `FINALIZED`, `MAJORITY_AGREE`, and leader
`SUCCESS`; finalized contract rejections are explicitly marked as negative
tests. The final tournament row is completed after the scheduled challenge
windows close.

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

## Production frontend

The existing Vercel project is `delealufejoel-4184s-projects/jestor`.
Production and Preview configuration were updated through the Vercel CLI to
the contract above with chain `61999`, RPC
`https://studio.genlayer.com/api`, and
`NEXT_PUBLIC_USE_MOCK_CONTRACT=false`. The final production deployment is
`dpl_G42MWzZSa6EMD6z6JXrUKhQk1AAH` (`READY`), inspect URL
`https://vercel.com/delealufejoel-4184s-projects/jestor/G42MWzZSa6EMD6z6JXrUKhQk1AAH`,
and production alias `https://jestor.vercel.app`. An HTTP smoke returned 200;
the served JavaScript contained the final contract address, Studionet RPC,
chain `61999`, and injected `window.ethereum` wallet logic. The homepage,
duels, circuit, and public verdict routes rendered in the in-app browser. The
Chrome extension provider was unavailable in this audit session, so no browser
transaction was claimed as evidence; the four-wallet CLI run below is the
authoritative live write/readback evidence.

## Historical state and limitations

The corrected contract intentionally starts a fresh state baseline because the
old deployment had no secure upgrade/migration path. Its historical address
is preserved in the README and is not presented as migrated data.

The browser can sign only through an injected EIP-1193 provider. Encrypted
duel drafts survive reloads in the same browser profile, but cannot be
recovered after secure browser storage is cleared or in a different profile.
Decorative validator animations are never consensus evidence; public verdict
pages rely on finalized state and receipt verification.
