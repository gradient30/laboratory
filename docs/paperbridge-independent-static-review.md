# Paper-bridge pilot independent static verification

Date: 2026-11-02 UTC

## Exact checkpoint and verdict

Reviewed commit: `f13ae5161b6279032989dafcfa1c915bf115ee4f`.

PASS, scoped to the day-1 four-age pilot's static content, actual SVG raster inspection, source attribution, and specified socket-free Node checks. This is not browser acceptance, physical testing, or full-year release approval. The full curriculum gate remains incomplete: 4 explicit age protocols out of 1460.

## Checks and corrected findings

- Four age bands have substantive differences: self-weight observation; three cross-sections with one light packet; nine fresh specimens over three spans; twelve fresh specimens in a two-section/two-span matrix.
- Paper quantities, A4 packet folding dimensions, section widths, bridge lengths, spans and end overlaps reconcile.
- Verified the original Science Buddies paper-bridge and University of Manchester span/deflection pages. These support the principles, not validation of the adapted household dimensions.
- Corrected and rechecked packet placement at U-section floor, book/bridge contact, magnified shallow-edge labels, and removal of packet instructions from the no-load youngest-age safety text.
- Corrected and independently runtime-checked age-specific question/inquiry projection and user-facing source projection. Integrated ageProtocols exactly equal the pilot source.
- Viewed all 16 actual librsvg/Cairo raster images. No evident clipping or text collision at their native static size. The final renderer's 16 SVG hashes match the rasterized versions. Raster evidence: `/tmp/paperbridge-qa/manifest.json`.
- Ran five protocol-progress unit tests: all passed. Covered historical records, old-client omission, locked retention, import conflicts, version isolation and size limits within those tests.

## Final history-guard delta

Read the committed dialog-history change. Evaluated the actual sameContext expression with seven cases: absent version, legacy v0, other version, different child and different age are rejected for the pilot; current v1 is accepted; absent version remains compatible for a legacy activity. Evaluated the actual progress setter: restoring a current-version step writes only the versioned protocol cursor and leaves legacy records, steps, viewedSteps and completed maps unchanged. Syntax check and all five protocol-progress unit tests passed again on the exact checkpoint. No regression identified in this scoped delta.

## Limitations

Browser/mobile layout, Back/Forward interaction and the 170 discovered browser tests were not executed. Existing Chromium socket denial was not retried or bypassed. Static evaluation does not replace browser event-loop acceptance.

No physical trial was performed. Two-millimetre fold accuracy and light-load displacement may be below household measurement resolution. The protocol explicitly allows unresolvable results, prohibits added load to force a result, and retains missing observations rather than inventing zero. Physical trial is a disclosed limitation, not an additional mandatory gate imposed by this review.

## SHA-256

- Pilot JSON: `076bc7c7d5fdda3ab9bdfbd4d25e33a150009074016921c4c8ca171ffeb56f5f`
- dist/data.json: `d044a818e6e3136eed76f654d7a30ba0a890be33a552235b3df151038142f05a`
- dist/diagrams.js: `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`
- dist/app.js, final checkpoint: `50fc56b718b8e49119ced9800edcc72f5313306c2906c50177685fd9fd65f457`
- worker/core.mjs: `ecffc353d60e049ba073167652a18bd51eaecbd0e2bf3a379d598644107ea499`
