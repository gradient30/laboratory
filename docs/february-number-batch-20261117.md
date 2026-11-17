# February number-card illustration batch (2026-11-17)

## Scope
Days 40 and 47, four age bands, four scenes each (32 scenes). Full serialized scene locks guard the new renderer; changed source scenes revert to the existing generic rendering. Source protocols, scientific content, release gates and manifests are untouched.

## Material and operational changes
- Give existing cards a single-sheet paper edge and strengthen blue/orange contrast while retaining every B/O label and number. No piles, extra thickness or inferred visited-state colors.
- Day 40, ages 4–6: show the six blue and four orange cards outside the empty ten-frame at preparation. Show the four orange cards outside the frame both before placement and after removal. All original grid lines and in-frame positions remain unchanged. Each scene now accounts for exactly six blue plus four orange cards. Outside cards are diagrammatically reduced to fit the margin, not drawn as a physical size comparison.
- Day 47, ages 7–9, final audit: replace the original 18-pixel-high counted strip with a usable empty counted area. Move the same eight numbered cards to two rows in the uncounted area; retain order 1–4 and 5–8. A one-way arrow shows transfer, while the counted area explicitly starts empty. No completed count or observation is filled in.
- Other scenes retain source card counts, card coordinates, grid and ring relations, labels, mathematical examples and unknown-result boundaries.

## Verification performed
- Rendered all 32 SVG scenes to PNG with Sharp; reviewed the complete contact sheet and the two materially changed layouts at full size.
- Fixed a preparation-stock right-margin clipping issue during review. Final stock right edge is 612 inside the 616 clip boundary.
- Target test: `node --test scripts/illustration-february-number.test.mjs`: 3 tests passed. Checks exact-source fallback, all source labels, non-target isolation, source geometry, youngest six-blue/four-orange conservation, outside-card clip bounds, audit eight-card preservation and empty counted area.

## Limits
Static rendering and structural checks only. This does not establish child usability, browser interactions, print layout, full regression or production deployment. Existing prescribed mathematical examples remain examples, not measured results. No production release or push performed by this worker.
