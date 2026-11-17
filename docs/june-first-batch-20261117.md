# June first batch: days 152–157

## Review and scope
Read all 24 age protocols and reviewed 96 original diagrams. Implemented 10 guarded scene changes: day 153 four setup scenes; day 155 six apparatus scenes. All other diagrams retain the original renderer. This is static illustration review, not full curriculum acceptance or a claim of photorealism.

## Actual improvements
- Day 153: cardboard observation frame now has a visible open aperture instead of a solid panel. The plant's three original leaf symbols, centers, radii and branches remain unchanged; these are location symbols, not a species-identification drawing or observed growth.
- Four plastic pots are tapered with recognisable rims and original drainage trays. Pot height extends by 3 drawing units to actually contact each tray. This is an explicit source-layout correction, not a claim that all geometry stayed unchanged.
- In the weighing setup, the scale platform extends up 5 units to contact the tray while its base stays fixed. In the reference-box setup, the closed reference box extends down 2 units to contact the scale. No mass display or measured value added.
- Day 155: five funnel assemblies now have cone shoulders supported on the actual receiving cup rim at (107,198) and (257,198). The throat extends to y244, leaving 47 drawing units above the empty cup bottom. The old geometry appeared to have a narrow unsupported throat sitting at the cup mouth.
- Six receiving vessels have transparent-plastic wall highlights, pouring spout/air gap, and side handle. This includes the direct-pour comparison, so both pathways use an identifiable receiving jug. No liquids, graduation numbers, measured volumes, timing results or expected flow outcomes have been invented. Drawing units are illustrative, not physical millimetre certification; the protocol's adult fit, vent and water-clearance checks remain essential.

## Preserved and deferred
- 152 proportional paper cards, 154 evidence/name timelines and practice cards, 156 backup-state cards, and 157 continuous-ramp/seam geometry remain unchanged. Their physical quantities, evidence distinctions and abstract models are more important than decorative redraws; no supported correction was identified in this pass.
- Day 153 leaf shapes remain schematic, no fabricated species detail. Day 155 clear empty vessels do not predict the level during trials. Actual 40 mL mark, 80 mL clearance and stable fit are verified on real apparatus, not inferred from this drawing.
- Exact whole-scene serialization guards prevent altered source material from silently receiving the targeted rendering. Original text and arrows remain present except the explicit apparatus-label correction below; output uses unique gradient IDs.

## Verification
- Targeted test suite: seven tests covering scope/labels, mutation fallback, IDs, unchanged plant identity, corrected support contacts, funnel rim/outlet geometry, and vessel quantities.
- Complete 5,840-scene baseline comparison: 10 differences, only days 153 and 155.
- Rendered 96 original PNGs and 32 updated/context PNGs; inspected contact sheets and enlarged setup diagrams for clipping, labels, and support relationships.
- Parent handles full regression, candidate manifest, commit, deployment, and live verification. No deployment performed by this batch.

## Follow-up apparatus label correction
All five funnel drawings now label the receiving vessel “接水杯”, not “空接水杯”. This neutral shared apparatus label avoids asserting that the vessel is empty during the 40 mL, timed collection, and two-pulse measurement stages. The setup's actual initial empty state remains determined by the procedure. No liquid surface or measured result is added. The full-source guard still matches the original curriculum exactly; only the renderer label changes. Tests explicitly cover this intentional text exception.
