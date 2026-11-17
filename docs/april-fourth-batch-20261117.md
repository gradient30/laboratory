# April fourth illustration batch (2026-11-17)

Baseline: `3c91fea19087ef1bd84820145713480d696fb630`.

## Scope and findings

Reviewed all four age protocols, materials, safety notes and 96 original scene renders for days 109–114. This batch changes 22 scenes: 13 on day 109 and 9 on day 111. The other 74 scenes remain unchanged. Days 110, 112, 113 and 114 use geometric, historical/information, calendar-route and classification models; adding physical decoration could change the information being compared, so no cosmetic redraw was forced.

## Changes

- Day 109: transparent plastic vessel rims, narrow wall highlights and base edges improve vessel recognition without changing water boundaries. Handles are added only to protocol-defined handled vessels (youngest group and the 10–12 source vessel). Eight initial rice symbols keep their count, position and bounds, with softened corners.
- Day 109, age 7–9 preparation: the protocol prepares dry tea portions before adding water. The old image prematurely filled both vessels. This scene now shows two dashed target lines at the original target height, each explicitly labelled “预标线”, clarifying both 80 mL labels as target volumes. No invented tea-leaf count is added.
- Day 111: observation bags now have thin side seams and an identifiable closed top band; the pouring-stage bag remains open. Covered soaking vessels have visible lids, while measuring vessels stay open. Transparent vessel edges preserve all original water geometry and samples.
- Day 111, age 10–12: the dry weighing scene gains a recognisable scale housing, display and bowl rim without numerical measurement results or added liquid.

## Scientific and visual boundaries

Every target scene uses an exact whole-scene source guard. Source changes fall back to the original renderer. Original labels (except the two clarified target-volume labels), arrows, sample positions/counts and non-preparation water rectangles remain unchanged. Representative group drawings remain representative: a drawn W/D vessel labelled three cups does not imply six vessels have been drawn, and bean icons are not measured seed outlines. No germination, swelling, settling or numeric reading is invented.

This is improved schematic vector illustration, not photographic realism or proof of usability with children. Pouring is still an upright schematic flow diagram; adult support is described in text rather than a fully drawn grip. No additional hands, liquid streams or fabricated observations were added.

## Verification

- `node --test scripts/illustration-april-fourth.test.mjs`: 7 passed, 0 failed. Tests cover exact guard fallback, original text, sample geometry/counts, arrow geometry, the dry-preparation exception, prescribed handle/lid/bag roles, dry scale boundaries and unique local SVG material IDs.
- `node qa/scope.mjs`: compared all 5,840 scenes; exactly 22 differ, confined to days 109 and 111.
- Rendered and reviewed the 96 original scenes, then the 32 updated day 109/111 scenes and contact sheet. Final full-size checks included the age 7–9 preparation target lines, youngest sealed bags and youngest pouring diagram; labels and target marks remain legible and within the canvas.
- Full repository regression, candidate manifest capture, commit, push and online verification are parent-task responsibilities and are not claimed complete here.

## Independent QA follow-up

The 13–16 baseline displacement diagram now explicitly labels the two representative bean symbols “同30粒（图中省略）” below the total-volume cup. The protocol still requires the same 30 beans; no beans or measured results were added. The age 7–9 dry-tea preparation labels now read “A：目标80mL” and “B：目标80mL”, complementing the dashed pre-marked lines. A seventh test verifies both clarifications and the unchanged two-symbol rendering. Both final full-size PNGs were re-rendered and visually checked for clear labels and separation. These follow-up edits require the parent to repeat full regression before capture/push.
