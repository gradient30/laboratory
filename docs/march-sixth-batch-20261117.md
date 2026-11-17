# March sixth batch: days 78–83

## Review and actual scope
Read all 24 age protocols (materials, safety and four actions each), rendered the 96 source scenes and examined six contact sheets. Rendered amended days again and reviewed final contact sheets and full-size youngest card scenes. This is a bounded vector clarity pass, not photorealism, a physical experiment or live-browser validation.

19/5,840 outputs change, only days 78, 79 and 81:

- Day 78, two youngest scenes: the gold circular target looked like a loose coin rather than the specified large paper card. Replace it with one square paper card bearing a simple drawn treasure chest, centered on the same demonstration intersection and fully inside its cell. The next scene shows that same kind of square card outside the empty grid. Move the original “大卡” label to its right rather than covering the picture. The row arrow ends just outside the card edge so its arrowhead remains visible; other grid, direction and coordinate geometry is untouched. These remain labelled demonstration conditions, not successful learner observations.
- Day 79, four scenes/six test strips: add a shaded quarter-width folded grip and fold line within the existing strip outline. This keeps the 1 cm grip / 3 cm flat portion concept visible in later testing views, rather than making them look like the separate unfolded overlapping measuring strips. Measuring strips, tape, original lengths, wall clearances and all expected/observed distinction remain unchanged. This drawing is schematic, not a projected height measurement. Existing introductory folded-strip diagrams already show the fold and are not modified.
- Day 81, thirteen apparatus scenes: add transparent cup rims and modest reflection marks; replace square 8×9 spoon heads with same-bounds rounded heads. All original cup walls, water rectangles, dedicated handles, salt/sugar identities, amounts, stages and blank records remain. No grains, residuals, dissolution rates, classifications or measured concentrations are invented. Three record-only scenes unchanged.

## No forced edits
- Day 80: retain slope/tower/base geometry and explicit adult-only lifting, first-event stopping, deformation vs tipping categories. Adding dimensional surfaces without a separate projection redesign would risk changing contact/base meaning. No claimed live handling demonstration.
- Day 82: retain exact physical-card/whole-strip counts, 90-degree rearrangement, removed-card inventory and area/perimeter model boundaries. No decorative pieces that could be counted as extra units.
- Day 83: retain actual-vs-traced boundary distinction, example notch shapes and uncertainty in causes. No invented veins, natural-damage diagnosis, restored missing tissue or predetermined classification outcomes. The artificial-cut protocol remains limited to the specified older-age adult preparation.
- Other day 78/79 explanatory scenes retained rather than padded with material artwork.

## Checks
- `node --test scripts/illustration-march-sixth.test.mjs`: 5/5 pass.
- `node qa/scope.mjs`: full 5,840 diagram comparison, only 19 changed, days 78/79/81.
- Whole-scene source lock tested against both description and element-text changes; validated original fallback retained.
- Every existing text label preserved. All source line/arrow endpoints preserved except the explicitly tested card-edge row pointer.
- Paper target count, square bounds and demonstration cell containment tested.
- Fold grip count and unchanged measuring-strip views tested.
- Cup count, water geometry, dedicated spoon count, submerged spoon head and bottom clearance tested; no result markers added.
- Static review caught the first card pictogram overlapping “大卡”; label was moved outside the card before final render/test.

No curriculum source data, source manifest, release gates, commits or push changed by this worker. Parent performs full regression and release checks.
