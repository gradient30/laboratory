# February map-material batch — 2026-11-17

## Scope and restraint
Reviewed days 43, 50 and 57: four age bands and four scenes each, 48 scenes. This batch changes **17 scenes**, not 48: day 43 youngest preparation card scene and all 16 day 50 scenes. Day 57 and the other 15 day 43 scenes remain unchanged. Only those 17 exact serialized source scenes are accepted by the renderer. Source protocols, layouts, gates and manifests are untouched.

## Useful corrections
- Day 43 youngest materials previously showed symbols and words only, despite the protocol requesting pictures. The same three existing cards now include recognizable tree, bench and pond drawings beneath the original symbols and names. No new card or map location is added. Pictures are not added to the older hidden-legend, changed-mapping or color-loss exercises, where they could change the task.
- Day 50 youngest fixed cards now contain tree A / house B / pond C pictures inside their original card bounds; the separate rotating paper retains its original point symbols. This visually distinguishes the physical cards from their map representation.
- Day 50 now visibly includes the fixed table star referenced in the instructions. It stays in the same outer scene position, does not rotate with any paper, and is labeled as a fixed far-edge reference rather than geographic north.
- Fixed base papers are visibly taped; movable route papers are not. Older transparent movable sheets have a dashed perimeter at the existing paper bounds and an explicit “底纸固定 / 上片可转” caption. No pin or pivot hardware is drawn.

## Accuracy checks
Original points, card positions, line/arrow endpoints, symbol categories, text and grid geometry are retained. Quarter-turn and half-turn constructed points were checked algebraically against the prescribed clockwise rotation. Passive-axis scenes retain stationary points; active-point scenes use the prescribed rotation. No participant answers, success counts or improvements are supplied.

Four focused tests passed: `node --test scripts/illustration-february-maps.test.mjs`. Coverage includes exact-source fallback and non-target isolation; original labels and geometric endpoints; restricted picture placement; star invariance and absence of tape on movable route papers; quarter-turn/half-turn and inverse-axis point relationships.

All 48 scenes were rendered to PNG and reviewed as a contact sheet. Card and rotation/layer layouts were also reviewed at full size. A first-pass tape placement on the movable 7–9 route paper was removed before final review and is now covered by a test. A normalized SVG comparison of all activity/age/step outputs against the baseline found exactly the intended 17 changed scenes, including no changes to day 57.

## Limits
This is a small material/operation-clarity improvement, not photorealistic art or evidence of child usability. No print/browser interaction testing, full suite, commit, push or deployment was performed by this worker. Full regression and release verification remain with the parent task. Day 57 was not changed merely to increase the coverage count.
