# April third batch: material scenes, days 103–108

Baseline: c20242b5cb20201fefc36a19e8baa035a8c024c3.

Reviewed all four-age materials, safety and actions for six days, and rendered/reviewed the 96 original scenes. This batch gives selected physical materials a coherent shaded appearance rather than applying decoration to mathematical diagrams. It remains illustrative vector artwork, not photographic realism, completed child-usability research or full production acceptance.

## Actual change: 12 scenes

- Day 106, youngest steps 1/3/4 (3): paperboard surfaces now show a pale paper face, distinct warm thickness edge and restrained highlight. Existing three board envelopes and all layer contacts remain. The traced footprints in step 2 stay untouched: these are outlines, not three solid objects. No corrugation or internal construction is invented.
- Day 107, youngest step 1 and ages 7–9 step 2 (2): real shallow paper boxes now have an inset floor and inside walls; the real marker has its cap, seam and cylindrical tonal highlight; the real ruler has unnumbered marks and a plastic surface; the eraser has a softly shaded body. Object envelopes, count, positions and arrows remain. All experimental pictograms/cards are deliberately untouched, since changing them would change the experimental stimulus. The open box remains empty at reset; no successful action is prefilled.
- Day 108, apparatus scenes (7): coherent material treatment of plastic ruler, rubber erasers, paper support and padded shallow tray. Every eraser remains within its exact original rectangle; the stacked blocks retain their complete contact boundary. No paper wrappers, additional weights or hand contact are added. Ruler marks have no numbers and do not claim a measured c₀. The support's original mathematical apex is intentionally corrected to a 4 px contact band, centred at the original support centre, contacting the same ruler bottom y=216, with original base at y=244. Against the displayed 480 px / 300 mm scale, the band represents 2.5 mm, consistent with the required 2–3 mm blunt support. This is a design illustration, not measurement. Other apparatus geometry remains unchanged; no tilt/balance outcome is invented.

Gradients and edge shading are internal to existing object bounds; this avoids a decorative projection moving a load centre, extending a ruler, changing board widths, or covering a caption. Each rendered SVG supplies unique per-instance gradient IDs.

## Intentionally retained

84/96 scenes are unchanged. Day 103 uses countable mathematical card models, where rectangular identity and counts are the point. Day 104 seed boundaries and measurement/sample placeholders are not beautified with invented natural details or damage, and sealed youngest handling remains intact. Day 105 spatial/scale models retain exact endpoints and the distinction from the historical painting. Older day 106 diagrams retain prescribed geometry, unknown slopes and hypothetical candidate curves. Day 107 experimental stimuli and records retain their original shape/information conditions. Day 108 instructions and position-search models are not made into supposed observations.

## Checks

- `node --test scripts/illustration-april-third.test.mjs`: 6/6 passed.
- `node qa/scope.mjs`: all 5,840 age/step scenes compared with baseline; exactly 12 SVG differences, days 106/107/108 only.
- Whole-scene source guards; modified descriptions, geometry, labels and element order fall back.
- Original rectangle envelopes/counts, stacked load positions/contact, blunt support geometry, all text and original arrows checked.
- Duplicate-page rendering verifies unique IDs and local gradient references.
- 48 final day 106–108 PNGs rendered; contact sheet inspected, with full-size real stationery, stacked apparatus and paperboard side-view checks. No observed newly introduced overlap or clipping.
- No curriculum, manifest, deployment gate, commit or push changes. Parent runs complete regression and deployment verification separately.

## Coordinator browser attempt and limits
A separate local run attempted the existing desktop/mobile visual-state and A4-print suites (8 tests). Chromium failed before opening pages with `socket() failed: Operation not permitted`; an approved outside-sandbox retry produced the same launch failure. Thus no page assertions, PDF generation, authenticated UI inspection or mobile rendering were reached. Both logs are retained locally. This is an environment-blocked browser attempt, not a passed visual/print check. Representative generated PNGs were independently inspected by the coordinator; they show improved material depth but remain vector instructional illustrations, not photorealistic output or child usability evidence.

## Independent review follow-up

Day 108, ages 10–12 step 2: add support-relative dimension brackets for 3 cm and 9 cm. Their common origin x=320 projects to the actual support centre; endpoints x=368 and x=464 are 48 and 144 px away (16 px/cm). The latter is exactly the displayed right eraser centre. Preserve the separate original movement arrow from x=368 to x=464; reposition the original 3cm/9cm labels next to their own brackets and add 距支点. This separates distance-from-support from the movement distance or ruler reading, without adding a second eraser, observed result or artificial hand pose. A new geometric test checks origin, endpoints, ratio, object centre and unchanged movement arrow. Re-rendered all 16 day108 images, inspected the changed full-size PNG, and re-ran scope: still 12 differences. Complete regression must be rerun after this follow-up.
