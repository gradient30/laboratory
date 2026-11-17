# April second batch: days 97–102

Baseline 773fc7ae09f8c11c6994941feea484397d790a4c. Read all four age protocols including materials/safety/actions, rendered 96 original PNGs and reviewed the contact sheet. This is a limited static improvement, not photorealistic illustration or complete educational/production acceptance.

## Actual changes: 16 scenes

### Day 101: nine apparatus scenes

Keys: lever101-46-1/2/3, 79-1/2/3, 1012-2, 1316-2/3.

The original support triangle ended in a mathematical point although the protocol specifies a blunt paper support with a finite 2–3 mm contact band. Replace the three triangle edges with a closed paper-coloured trapezoid: original centre p retained, contact at x=p±2, y=216; base retained at x=p±20, y=244. The 4 px band corresponds to 2.5 mm against the illustrated 480 px/300 mm ruler. This is a design representation, not measurement of the actual apparatus. The ruler bottom remains y=216, so there is no added gap or penetration. Support height/base and all eraser load bounds remain unchanged. The shifted-support scenario retains its distinct centre. Do not claim the old point geometry was preserved: this is an intentional correction.

Add 29 unnumbered marks within the ruler's existing 480×8 rectangle so the child can recognise the instrument. No c₀ value, observed equilibrium, centre-of-mass measurement, extra mass or hand pose is drawn. Original adult-only handling, short observation and stop rules remain intact.

### Day 102: seven filtering scenes

Keys: filter102-46-2/3, 79-2/3, 1012-1, 1316-1/2.

Original pale-yellow filter-paper lines were hard to distinguish against the cream background, especially in the single-versus-double-layer comparison. Darken only these edges to #9A743E. Exact edge coordinates/counts remain; the two-layer drawing still contains four paper edges and the single-layer drawing two. Bare mesh stays bare. Add a shallow open-mouth ellipse to each existing 76×34 receiving cup. No liquid level, captured particles, four-leaf outcome or filtration success is invented. Blank receiving areas continue to be schematic pending observations, as stated in the original descriptions; no outcomes are inferred from them. No changes to the four salt-sample safety labels or observation timing.

## Intentionally unchanged

97: Preserved original polygon boundaries, scale bars, aspect ratios and grid stretch model; no made-up species veins or measured growth. Scale relationships are the teaching object.
98: Fictional/modern/historical source distinctions and unsupported claims remain; no invented ancient writing or sentiment.
99: Equal-height/different-distance and changed-scale/direction models intentionally use geometry; no decorative terrain or smoothed profiles added.
100: Fold coordinates, corner identity across 180° rotation and desired versus measured fold traces remain; no fabricated participant outcomes.

80 of 96 reviewed scenes retain identical SVG output. Non-target days are unchanged.

## Checks

- `node --test scripts/illustration-april-second.test.mjs`: 5/5 passed.
- 5,840-scene before/after comparison: exactly 16 differences, days 101/102 only.
- Exact whole-scene guards and modified source fallback checked.
- Contact width/centre, ruler-bottom contact, base geometry, eraser positions/counts tested.
- Filter paper edge counts/coordinates, original rectangles and labels checked.
- Final 32 day101/102 PNGs rendered and contact sheet reviewed; full-size stacked-load and single/double filter scenes inspected. No observed introduced overlap or clipping.
- No curriculum/source-data, manifest or deployment-gate edits; no commit/push or production verification.

## Coordinator aggregate verification note
First full regression failed one existing password rate-limit test (`200` versus expected `429`); authentication code was not modified. The limiter uses fixed 900-second buckets, and this run crossed the 13:45 UTC boundary, a plausible time-boundary explanation rather than proof of a new illustration regression. Standalone unchanged password suite subsequently passed 13/13. First failure log retained locally; full aggregate regression was rerun without weakening assertions or modifying authentication.
