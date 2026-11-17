# March final visual batch: days 84–90

Baseline: d99c6d0a6028b01048b97a99007f2f3db73aff61. Reviewed all four age protocols (materials, safety, actions) and 112 original rendered scenes. This is a bounded static illustration pass, not formal whole-month acceptance or production verification.

## Actual changes: 12 scenes

Day 86: 4 scenes (`labels86-46-1`, `46-2`, `79-3`, `1012-1`). Previously rulers and crayons were nearly indistinguishable rectangles and notebooks resembled blank cards. Added unnumbered ruler tick marks, whole blunt-ended wax crayons with paper wrappers, and notebook binding/page edges. All original object envelopes, object counts, labels, box geometry, assignment unknowns and trial sequence remain. Illustrative ruler ticks are not calibrated measurements. Box-label pictures are still pictures, not additional stationery in the experiment. First trial capsule-like crayon ends were replaced by a short blunt taper and flat rear so they do not resemble medication capsules.

Day 88: 8 apparatus scenes (`dissolve88-46-1`, `46-2`, `79-1`, `79-3`, `1012-1`, `1012-2`, `1316-1`, `1316-3`). Open cups have small mouth ellipses and wall highlights; lidded jars retain their closed mouths and receive grip ribs on the existing lids. No extra lid added and the detached lid remains detached. Square 2.5 ml measuring bowl becomes an oval within its original envelope with the original handle and dosing arrow. Stirring line receives one rounded bowl at its existing submerged endpoint, with 21 px clearance above the original cup bottom. Physical water rectangles, water surfaces, container boundaries and all arrows remain. No sediment/clarity/weight/concentration outcome is added. All symbol-model frames and counts are unchanged, including distinct within-kind multipliers.

## Reviewed, intentionally unchanged

84: Script/language relationship cards, coding unknown and source graph already explicitly distinguish modern examples, history and evidence; decorative invented writing would undermine that distinction.
85: Fictional maps, layer shift and route constraints use intentionally abstract icons; preserving positions, route graph and unknown width is more important than adding realistic trees.
87: Cardboard geometry, finite support regions and void-centroid warning are explicit. Did not replace diagrams with unverified hand poses or alter contact/centre geometry. The side-view remains a labelled schematic rather than a realistic action depiction.
89: Arrays correctly separate six-card youngest task, actual trial records, construction examples, model perimeter checks and proofs. Rounded/decorative cards would weaken touching-edge geometry.
90: Organ connections, actual visibility and unknown roots/flowers are explicit. Generic round leaves remain schematic; no specific species veins, roots hidden in soil or flowering observations have been invented. This pass does not claim botanical realism.

Remaining 100 scenes in the 112-scene scope have identical rendered output. Non-target days are unchanged.

## Evidence

- `node --test scripts/illustration-march-final.test.mjs`: 5/5 passed.
- Exact whole-scene guards; modified description or text falls back to native rendering for all 12 targets.
- 5,840 before/after scene comparison: exactly 12 differences, days 86 and 88 only.
- Original 112 PNGs reviewed; final 32 day86/88 PNGs generated and contact sheet reviewed, plus full-size youngest stationery. No observed label clipping or overlap in changed scenes.
- No curriculum/source-data/manifest/deployment gate edits. No commit, push, browser interaction or online release verification performed by this worker.
