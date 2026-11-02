# Day 5 independent static review

Verdict: PASS for standalone content and static diagrams only; not a full curriculum release approval.

Source: `day05-age-protocols.json`, SHA256 `8e0691918891d9c7d4c15faf543a6c439d1de14a0de37eaa4432d9952f2256df`.

Reviewed all four age protocols: adult-only two-liquid demonstration; three known references; serial vinegar dilution; two reaction samples with volume-matched water reference. These differ substantively in materials, actions and evidential interpretation. Checked quantities, utensils, sequence, measurement limits and safety. Dilutions 1/2, 1/8 and 1/32 refer to samples before indicator addition; no colour-to-exact-pH conversion is claimed. Older protocol uses 111 mL water and 4 mL vinegar, three dedicated 1 mL measures, three test spoons plus one separate preparation spoon. No claim of exact neutralization or restored chemical composition.

Resolved utensil omissions/duplicate material entries and cross-contamination routes: seven dedicated spoons for dilution preparation/testing, explicit rinse/dry rules for shared measures, dedicated soda preparation spoon. Reaction cups remain open; food vinegar 4–6%, limited soda solution increments, no cleaners/hot water/ingestion; adult handling and splash goggles required. Room-temperature extraction bag is not a reaction vessel.

Primary sources checked: ACS Red Cabbage Indicator (https://www.acs.org/education/activities/red-cabbage-indicator.html), including room-temperature bag extraction; ACS Chemical Reactions and Color Change (https://www.acs.org/education/resources/k-8/inquiryinaction/fifth-grade/chapter-3/chemical-reactions-and-color-change.html). Specific home quantities and younger-age adult demonstration are adaptations, not source-validated experimental results.

Actual static pixel inspection covered all 16 diagrams, with final older-age sheet reinspection after correction of misleading decreasing liquid level. Grey liquid is explicitly a non-result placeholder. Latest material-only change regenerated all 16 SVGs: every SVG hash equals the previously rasterized version. Evidence: `/tmp/day05-qa/manifest.json`; renderer SHA256 `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`. No new concrete content or static-image blocker found.

Not performed: household physical trials, browser rendering/interactions, integrated progress/storage regression, full 365-theme acceptance. No browser launch was retried. Static PASS does not close remaining release gates.
