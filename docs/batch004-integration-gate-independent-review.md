# Integration gate independent static review

Verdict: PASS for the scoped gate implementation and local tests, not publication acceptance.

## Reviewed final file hashes

- `scripts/release-evidence.mjs`: `4492853470a83de1bef15523d8c1ca55eab2cf2cf53773c743208243de1e0060`
- `scripts/release-evidence.test.mjs`: `c5de04e520926db69f00d2ae6211000745930d7a9c1d95eeb3a0bacfd6ade306`
- `scripts/check-age-protocols.mjs`: `cef35f4c2683d3292719434d32bee129a460934768ec083139bf56769369dc81`
- `scripts/check-age-protocols.test.mjs`: `55f15ce203db3d7927d79896f451069d14269b1e7a8fe93cb57164379e3da8b3`
- `scripts/integrate-age-protocols.mjs`: `f49c47835f39b2109dfacc11d79c87dd7d20b1aaca1a4729d083c7ee9be3f48d`
- `scripts/integrate-age-protocols.test.mjs`: `b70d4642b7f2a8d8bbd71db60c6a4f109a6ddb0357050d643218301eb97ea44c`
- `docs/age-protocol-release.json`: `e22d9c194c1fbd2ed2b701c5693ec256531a0200a36b0ee0c020eb09b44852d5`

Named gates are specification, facts, quality, regression and user-feedback. Structural validation requires exactly one passed entry per known gate, matching data and release-source fingerprints, reviewer identity text, a constrained docs report path and exact report hash. Missing, duplicate, pending, stale and unknown entries fail. Deployable source, configuration, package lock, migrations, validators, tests and CI are fingerprinted; docs evidence is excluded to avoid self-reference and report bytes are independently bound.

Legitimate identical materials require a substantive rationale present in the exact independent report during reviewed-input integration. Shared materials do not bypass rejection of copied actions, knowledge or artwork. The Day 9 shared apparatus has separately documented genuinely different controlled operations. No unnecessary apparatus is required solely to make lists unique.

Found and resolved a consistency gap: shared materials were canonicalized in the curriculum checker but raw-serialized in the reviewed-input reader, potentially missing rationale requirements for whitespace-only variations. Both now use the same exported canonical function; the integration test includes whitespace-varied material lists.

Executed locally: 17 tests across check-age-protocols, integrate-age-protocols and release-evidence passed before the canonical correction; after correction, independently re-ran all 6 integration tests, all passed. Also directly inspected the corrected shared import/use and test fixture. No browser launch, remote operation or deployment was performed.

These checks validate evidence structure and byte binding, not factual truth, reviewer independence or substantive quality of a report. Evidence remains pending where not supplied. Full 365-theme coverage and complete five-gate release acceptance are not established by this review.
