# Day 8 independent static review

Verdict: PASS for standalone age-specific content and static diagrams; no full-release approval implied.

Source: `day08-age-protocols.json`, SHA256 `ca2d421be920e100b78734214991309c0c223491364b371923a38c0885f0b43f`. All four protocols return no errors from the shared `validateAgeProtocol` validator.

Reviewed all materials, actions, timing, quantities, knowledge, safety, source boundaries and diagrams. Four designs are substantively different: adult-only single gentle stirring observation; reversed addition order; two fresh samples per stirring dose with an operational interface endpoint; equal-volume mass measurements and limited density reading ranges followed by qualitative layering.

Resolved two practical issues: youngest-age adult timer now listed; four middle-age samples now prepared sequentially immediately before each test, with approximately five minutes of initial settling recorded for each, rather than inadvertently giving later samples much longer settling. Guide and first diagram match this sequence. Total allowance revised to 50–60 minutes, optionally split by paired rounds.

Mass subtraction and density units are correct. The range [(m−2d)/(50+u),(m+2d)/(50−u)] has correct extremal directions for positive nominal volumes; it is explicitly a simplified reading budget, not a confidence interval or full instrument accuracy bound. Repeated readings are not independent samples. Unstable readings, inadequate volume graduations and overlapping ranges permit inability to distinguish; no invented precision or guaranteed density outcome. Density is distinguished from immiscibility. The interface endpoint does not imply elimination of residual droplets; 300-second unconfirmed observations are not fabricated completion times.

Materials sum correctly: younger 30 mL water/10 mL oil; two-cup 60/20 mL; four-cup 120/40 mL; oldest nominal 50 mL each, separately weighed with dry-container baselines. Residual transfer oil is disclosed and final layer heights are not used as volume measurements. Only room-temperature water and edible oil are permitted. No ingestion, hot oil, alcohol, detergent, closed shaking or spraying; adult pouring, spill cleanup and absorbent waste handling are explicit.

Primary sources opened and checked: ACS Density: Sink and Float for Liquids (https://www.acs.org/middleschoolchemistry/lessonplans/chapter3/lesson5.html), supporting equal-volume mass comparison, density and oil-water layering; MIT Energy Initiative research account (https://energy.mit.edu/news-events/news/separating-finely-mixed-oil-and-water), supporting dispersed-droplet distinction only. Household stirring doses, timing and reading budget are transparently adaptations, not validated results from those sources.

Actual static raster inspection covered all 16 diagrams and final revised 10–12 sheet. Latest first diagram has only the currently prepared cup filled and three future cups empty, with unobstructed timing label. No visible clipping, misleading prefilled numerical results, unsupported apparatus or material-count contradiction found. Evidence: `/tmp/day08-qa/manifest.json`, binding source above, 16 SVGs and 20 PNGs; renderer SHA256 `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`. Rasterization uses librsvg/cairo, not a browser.

Not performed: physical household trials, browser acceptance, integrated progress regression or complete 365-theme release gates. No denied browser operation was retried. No remaining concrete standalone static blocker identified.
