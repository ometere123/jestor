# Jestor corrected release manifest

This manifest records only evidence produced by finalized receipts or
authoritative `LATEST_FINAL` reads. It does not treat a submitted hash, a
mock adapter, or a UI animation as proof.

## Contract deployment

| Field | Verified value |
| --- | --- |
| Network | Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Local CLI | `genlayer@0.39.1` |
| Frontend runtime | Next.js `16.4.2`, viem `2.57.7` |
| Contract | `0x3B7106e084F89EC2B6b01C27E2ada161B0728B36` |
| Deployment transaction | `0x4c47d0ece42a525d098d78cf8ce17b3cd8fb3c2e27b67bb310a781eeaad4cb4d` |
| Deployment receipt | `FINALIZED`, `MAJORITY_AGREE`, leader `SUCCESS` |
| Retrieved source bytes | `93796` (CRLF byte representation) |
| Retrieved/source exact SHA-256 | `4329cf5f67e1ffb00edd98e457f2b7f261b4e8279c9f946fba858f74ba23cd40` |
| Canonical Git source bytes | `92574` (LF blob) |
| Canonical Git source SHA-256 | `25ac8add8adbcc9d77df40ef0437e9adafdbd89d1615a11da3e6e37802298847` |
| Canonical Git blob | `6bbe25764c37b28b0f5b70a6e5ee13cd32f8f6c7` |
| Code commit containing deployed contract | `489cba3` |

The retrieved source was compared byte-for-byte with the release working
source before release. The previous deployment
`0x2e23BBA29011dB9Fd001ce0e0A234BB90974Bbd7` remains a historical baseline;
there is no automatic migration of its state.

## Finalized Studionet integration run

The run used five existing funded CLI-managed accounts:
`party_a`, `walletA`, `walletB`, `conveyance-deployer`, and `party_b`.
The runner checked chain ID `61999`, waited for `FINALIZED`, required
`MAJORITY_AGREE` and leader `SUCCESS` for positive writes, and recorded
finalized disagreement/rejection paths as non-mutating negative evidence.

Identifiers from the final contract state:

| Item | ID |
| --- | --- |
| Approved prompt | `436ecefc71cedf930b7f9589` |
| Caption | `2ed8cc64355237442e8ee0bd` |
| Challenged roast | `0eb426f0fa369e3de7bf5f09` |
| Accepted remix | `867da21a9210f44e93d8d3f1` |
| Sealed duel | `21d687344b431ef760c8baeb` |
| Four-player tournament | `6626cf980c3ccbd1560cf31f` |

Positive finalized writes:

| Method | Finalized transaction(s) |
| --- | --- |
| Profiles | `0x9b7a71e0ff5c66da13331aeb0541f275ca652e104cdea607dcfc8f38ef550d62`, `0xc1441ee0efbb42ae13ed5577fc2deed4928d57f777c6f5e129b9292b136e2ec6`, `0xd0648c20b19b535156bba31ed2daf0959347a49fb04e18749e4632d8e89eb984`, `0xa390128a362d8ba7b5669cb38ff0d5737d6138da5835a18781e356f1d50e03a9`, `0xf11e53ea79230d2f7bba9d4e4efb1299b4844cf29d4b0fe6c7c2280cbac0b541` |
| Prompt | `0x57f0fb4123de83dfb10a35b2c43d87fdad20e341b8ccd0290abc5884a5adff03` |
| Caption / roast / challenge | `0xc7ffeef703ed1f8ce19ba06bc9115b17a3e1ac749451b9b1950836d1965f1788`, `0xd5d761f8934b5c43273b62f8971ad95dbd58185b087bfb44f0dc693f31eb7ec8`, `0xb9f8bce3dff13d29bba42e0ea82dd2a65ec3e15d13dde64e0ee4ab56f226bc50` |
| Chaos / remix | `0x55aaf3caee71f3559c10a6205e14079db5e1c9f7a2313622d07d64dec47790af`, `0xa2c77d6b6bc10b2711c4e836153e18c4bf5159cf9f507ac6ae15093fb2f3044e` |
| Duel start / join | `0x60780184b0c8ee9ae0225805d9135304a8ae039c70c312f5fdb47999dbd3e8c5`, `0x7b9d6084108688269956dc907c404318cdd82d197c4c99b6c39d1552d3d9602d` |
| Duel reveals / resolve | `0xf518bed508ac4d772918271911a8eec275ceb978004f7b0ec54ac3083915cc8f`, `0x26c4f558812d7caeae2d514e4836b3c45680ede91f66a78a20e21caecc5d2547`, `0x6e5bc010196cea4c386bb0a64aca6fa6a2c98ed23db361834fd9138f12cb7182` |
| Tournament create / joins | `0xbda6d346fddde708ee5539c35328dd8e533763e2a080530e2c1e24feb0f68d3c`; joins `0x381314b6209d00f6c07542f5a366b43cd39efb9cc55c875107762d048864b5d1`, `0x5b15d175a08938d56fbdfb2cab61afe90288e768bc646e8241a31c22b56d1275`, `0x91cc1362f8c67053f12c9ce5e3322a4dabbe577478a455925e9fa626ebbdf974`, `0x841461e3381919e2c77f96f16d45b03e806eccc91435abbf04fc975bbccf48ef` |
| Semifinals / progression | `0xa9ee33fe58d3795d37a91174aad67a98180d281c730c402eb7b03203ae46501c`, `0xbb9ae730c321e5f76f62a935d7fcb474f0f1b320655a1ee14b4391944c0c9e62`, `0xd730a122cb39ea5c5ebc8ed56161b658838c02a489b6aacddc2d8ce4f5d81995`, `0xbb706b844fae6894b6f1ad4ff00a10b32ddd134ceb70a7fc7a8ad3cc6515f6bb` |
| Final / finalization | `0x446090b576fe6155f32a340635168ed4bb45b3160aeb8a299b688ee512df4342`, `0xb4333597c71d6f3336d21d59232af22186515e920316193eaba7dbf66f21c7b5` |

Final authoritative readback:

- Protocol stats: `chain_id=61999`, `finalized_verdicts=8`, one approved
  prompt, four submissions, one challenge, one duel, one remix, and one
  tournament.
- Roast challenge: `KEEP`, original delta `33`, current delta `33`, immutable
  history contains initial and challenge phases, and the challenge record is
  settled.
- Duel: finalized/resolved `DRAW`, both entries revealed only after the valid
  reveal sequence, actual deltas `0/0`; no default winner was created.
- Tournament: `status=settled`, `stage=complete`, `finalized=true`, champion
  `0xac3ac69dc0bde389256dd6748c75817ead9286d9`, semifinal winners `A/B`, final
  winner `A`, actual final deltas `40/10`.
- Career and ranking: champion has `tournament_wins=1`,
  `tournament_finalists=1`, `season_points=5`, and is first in the sorted
  leaderboard at balance `98`; the non-participant challenger has one
  finalized challenge and `VERDICT_SCOUT`.

Negative finalized evidence included an invalid prompt reference, a premature
duel reveal, a copied remix, five bounded semantic disagreements while
challenging the first semifinal, five while challenging the final, an expected
expired challenge rejection, and a semantic-disagreement duel resolution.
All disagreement transactions were state-neutral; none was counted as a
successful write.

## Verification results

| Check | Result |
| --- | --- |
| GenVM lint | `genvm-linter==0.11.0`, 3 checks passed |
| Direct Mode | 21 passed |
| Frontend unit | 7 passed |
| ESLint | passed with `--max-warnings=0` |
| TypeScript | passed |
| Production build | passed; 14 routes |
| Playwright local browser smoke | 2 passed, live test skipped without provider |
| Production dependency audit | `npm audit --omit=dev`: 0 vulnerabilities |
| Live CLI Studionet smoke | completed; all positive writes finalized and authoritative readback passed |

The live Playwright spec remains fail-closed and was not presented as executed
evidence on this host because no real injected EIP-1193 wallet provider was
available to the Playwright browser context. The genuine five-wallet CLI
journey is the authoritative live transaction evidence. CI runs the local
browser smoke on every push; the live browser journey remains an explicit
provider-dependent test.

## Production frontend

| Field | Verified value |
| --- | --- |
| Project | `delealufejoel-4184s-projects/jestor` |
| Deployment | `dpl_6mfRwfRyudtPezfRurLprwhiGsV7` |
| Inspect URL | `https://vercel.com/delealufejoel-4184s-projects/jestor/6mfRwfRyudtPezfRurLprwhiGsV7` |
| Production alias | `https://jestor.vercel.app` |
| Ready state | `READY` |
| Effective public contract bundle check | new address present, old address absent |
| Effective public RPC bundle check | `https://studio.genlayer.com/api` present |
| Wallet bundle check | `window.ethereum` provider path present |
| Production smoke | homepage and `/verdict/final-release-smoke` returned HTTP 200 |

Vercel Production and Preview values for contract address, chain ID, RPC, and
`NEXT_PUBLIC_USE_MOCK_CONTRACT=false` were updated through the Vercel CLI before
this deployment. No browser transaction is claimed without a real injected
provider.
