# Day 6 seed germination — independent static review

Date: 2026-11-02 UTC

Source SHA-256: `ccddf69c7b5603a7cf7eb5211bac7b09f4f9bdd74d2b0231496a64df6c4f3a25`

Verdict: PASS for standalone content, source-support and actual static diagram inspection; not final release approval.

Four substantive age-specific designs are present: three seeds tracked in one wet box; six wet versus six dry seeds; immediate versus approximately 48-hour delayed first watering with both calendar and exposure-time records; two source batches × wet/dry × two independent boxes, four seeds each (32 total). Material/box/paper counts and water reserves reconcile. Box-level replication is correctly distinguished from seeds sharing one microenvironment. Unknowns and stopped boxes are not substituted with zeros; five-day observations do not establish permanent nonviability.

Reviewed adult-only loose-seed handling, no ingestion, untreated food seeds, no pre-soaking or pooled water, open containers, no heat/direct-sun acceleration, immediate whole-box stop/disposal on suspected mold, and maximum five-day window. Per-check watering stops when moist without pooled water; reaching the 5mL cap without adequate moistening also stops the preparation/box rather than inviting unbounded extra water.

Opened original Exploratorium Seed Germinator, University of Minnesota Seed Physiology and SAPS Investigating Seed Germination pages. These support damp-paper observation, germination requirements and quantitative comparisons, not the exact dry-mung-bean household timing. Source pre-soaking/reservoir methods were not imported.

Viewed all 16 actual librsvg/Cairo raster scenes and re-viewed the final affected 7–9, 10–12 and 13–16 sheets. Seed counts, dry-before-watering state, actual delayed-watering depiction, and consistent post-randomization box positions agree with the procedures. No evident clipping/text collision or prefilled successful germination result remains. Evidence: `/tmp/day06-qa/manifest.json`; renderer SHA-256 `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`.

Shared validateAgeProtocol passed all four age bands on this source. No browser/mobile interactions, physical growth trial, or full integrated regression was run by this review. Timing/visibility are untested adaptations with explicit inconclusive-result handling, not an imposed blanket physical-trial gate. Overall five release review gates remain separate.
