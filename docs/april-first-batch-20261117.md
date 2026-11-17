# April first visual batch: days 91–96

Baseline a28406c238dd2a5da65c936a04d02a1c15057872. All four age protocols, material lists, safety and actions reviewed; 96 original PNGs rendered and their contact sheet reviewed. Bounded static illustration improvement, not a claim of photorealism, user testing or formal whole-month acceptance.

## Actual changes: 14 scenes

Day 93: four scenes (`check93-46-1/2/3`, `check93-1316-3`). Replaced ambiguous ruler/crayon rectangles with identifiable unnumbered ruler ticks and whole blunt-ended wrapped crayons. Added notebook binding/page cues. The same visual language is scaled down to the youngest checklist pictograms, with tick lengths constrained to the original icon bounds. All object counts, original object envelopes, box positions, checklist state circles and labels remain. No check marks, successful packing outcome or extra items added. Ruler marks are illustrative, not a calibrated scale.

Day 95: ten apparatus scenes (`mass95-46-1/2/3`, `79-1/2/3`, `1012-3`, `1316-1/2/3`). Existing upright plastic cups gain shallow open-mouth ellipses; jars with existing lids remain closed and receive grip details on those same lids. Original water rectangles, container boundaries, balance displays, spoon circles/handles and transfer arrows remain unchanged. No added liquid, spoon, lid, measured weight or concentration.

Substantive observation correction in four scenes: `mass95-46-2/3`, `79-2/3`. The post-transfer small cup previously appeared blank (suggesting no residual sugar), while `79-3` depicted a fixed solid residue. Replaced that ambiguity with a dashed unknown panel, question mark and “待观察” within the same small cup. Removed only the fixed residue rectangle in `79-3`. Initial sugar portions remain as preparation schematics; actual residue is not predetermined. Existing label “小杯 + 实际残留” remains, meaning whatever is actually present must stay with the weighed cup.

## Intentionally unchanged

91: Evidence cards and missing areas use explicit modern abstract symbols; adding fake old writing or decorative restoration would undermine their epistemic distinction.
92: Position frames, level intervals and cross-sections encode exact model geometry and explicitly separate layer units from board thickness. Not made into a realistic hill or smoothed profile.
94: Side-view contact spans, gaps, offset signs and conditional centre models are functional geometric evidence. No perspective or arbitrary thickness added that would obscure contacts or suggest guaranteed stability. Adult catching and stop rules remain in original protocol/text.
96: Equal-interval number lines, starting points, odd/even arguments and observed-versus-reference positions retained; realistic travel imagery would misrepresent a tabletop model.

82 of the reviewed 96 scenes remain byte-identical in rendered output; no out-of-scope day changes.

## Checks performed

- `node --test scripts/illustration-april-first.test.mjs`: 5/5 passed.
- Full 5,840-scene before/after comparison: 14 differences, days 93 and 95 only.
- Exact whole-scene guards; description/text mutation fallback checked for every selected scene.
- Original labels, stationery counts, box versus notebook distinction, cup/water geometry, arrows and spoon identities tested.
- New 32 day93/95 PNGs generated and contact sheet inspected; full-size youngest checklist and moved residual cup inspected. No observed new clipping or label collision.
- No source curriculum, manifest, deployment gate, commit or push edits. Production verification remains with parent task.
