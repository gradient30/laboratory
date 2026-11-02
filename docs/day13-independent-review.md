# Day 13 independent static review

Verdict: PASS for standalone four-age content and static diagrams.
Source SHA256 `36f35aaa09e361cf378f5cc55f5ca5a391f6feca14df2a6f380d51711e370f13`.

Reviewed all materials, actions, safety, knowledge, guides and source boundaries. Designs genuinely differ: no-load flat foil versus box; one boat's load addition/removal; two base designs with three new boats each; three matched pairs testing load distribution plus optional conditional displacement estimate. Foil dimensions, approximately 2 cm sides, shallow basin and counted reusable coins are consistent. Fixed 6/12-coin ceilings are not maximum capacities. Invalid boats, leakage, tilt, bottom contact, ceiling observations and insufficient single-layer placement space remain distinct.

Resolved: large coins may exhaust flat placement space before 12 coins, so this is now a separate layout stop, not evidence of instability or capacity. Added youngest-age adult timer and explicit dry/electrically isolated equipment placement. Low age has no coins; adults handle all coins, edges and water, with counted recovery and immediate stops. Reliable scale readings are optional: unresolved foil mass is missing data, not zero. Geometric box volume is not safe capacity; stable floating mass-to-freshwater-volume conversion is explicitly approximate and conditional.

NOAA original text opened and checked: https://www.noaa.gov/office-education/outreach-communication/hands-on-science-activities/build-a-boat . It supports displacement, buoyancy, foil boats and distribution/stability; local low-load ceilings and dimensions are independent adaptations, not NOAA-tested standards.

Independently generated all 16 SVGs with the actual candidate renderer and rasterized via librsvg/cairo. Initial pixels exposed water fill and waterline incorrectly crossing dry boat interiors. Author corrected all boat cross-sections; independently rerendered and viewed all 16 final images. Water now remains outside the dry hull, coins are on the floor, and empty/loaded diagrams agree with stop conditions. No new visible clipping or contradiction found. Evidence: `/tmp/day13-independent-qa/manifest.json`, binding final source, 16 SVGs and 20 PNGs; renderer SHA256 `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`. Final four shared validators return no errors.

No physical trial, browser acceptance, integrated regression or full-year/five-gate release approval is claimed. No remaining concrete standalone static blocker identified.
