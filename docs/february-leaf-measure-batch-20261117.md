# February leaf measurement illustration batch — 2026-11-17

Scope: day 48 (leaf length/width) and day 55 (traced projected area), four age bands and four scenes each, 32 source-locked scenes. No protocol data, release gates or manifests edited.

## Changes
- Day 48 measuring rulers now have a casing extending six SVG units past each measurement endpoint. A distinct zero reference lies at the original base/left reference, inside the casing rather than at its physical end. Other ticks remain unnumbered illustrative marks, not millimeter readings or measured lengths. Reference axes and endpoints do not move.
- Existing closed physical-leaf silhouettes receive a pale-green interior, without smoothing the polygon, adding veins or changing area. Grid projection scenes remain unfilled so the classification grid stays visible.
- The youngest length-transfer scene now has visible two endpoint marks and their connecting segment on the existing paper strip. The alignment scene has three base marks on the existing common baseline; no invented tip heights or ranking are supplied.
- Day 55 youngest first scene distinguishes the solid leaf from the later empty traced outline. Only the first physical leaf receives fill; no grid classification is pre-colored.
- Day 55 ages 7–9 now shows a fixed tracing-paper border and two tape pieces. These stay fixed across all four scenes while the original lower grid moves by the authored offset. Original leaf outlines, all grid lines and the movement arrow are retained. The first two bottom notes are relocated to unused right-hand space to avoid the new paper edge; text is unchanged. Tape was moved above the motion arrow during visual review.

## Scientific source-diagram correction
Day 48 ages 7–9 rotation scene originally drew an eight-vertex leaf on the left but a different four-vertex diamond on the right, despite the instruction to rotate the same leaf. The right diagram is now a strict 180-degree rigid transform of the left blade, longitudinal axis and petiole together. This deliberately replaces the incorrect original right-side geometry; it is not a claim that all original contours were retained. The transform preserves the same blade width, length and polygon area, and does not supply a measurement result. Both side panels remain unchanged.

## Checks
All 32 scenes rendered to PNG and inspected as a contact sheet; ruler, transfer and layered-paper layouts also inspected at full size. Four focused tests passed (`node --test scripts/illustration-february-leaf-measure.test.mjs`). Tests cover exact-source fallback, non-target isolation, label retention, line geometry, ruler source bounds, physical-leaf/trace distinction and fixed upper-paper versus moving lower-grid, and the rotation exception’s copied vertices, axis/petiole, equal dimensions and polygon area. The final rotation PNG was inspected after the correction.

Static checks are not child usability, print, browser interaction, full-regression or production validation. This worker did not commit or push.
