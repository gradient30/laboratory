# Day 7 shadows — independent static review

Date: 2026-11-02 UTC

Source SHA-256: `66091f154a7e62785653c13da51a6181b6043084251784ba5bbf16a81efc8d34`

Verdict: PASS for standalone content, source support and static diagram inspection; not final release approval.

Four substantive designs: moving an indoor LED while object/screen remain fixed; three-time outdoor shadow endpoint/length observations; paired near-simultaneous measurements from two actual card heights; one card at three times with shadow-endpoint intervals transformed to solar elevation intervals. Cut/fold dimensions reconcile (15/25cm strips minus 5cm feet produce nominal 10/20cm vertical sections). Real heights and common units are required. atan(H/L) and reversed interval endpoints are correct; unpropagated height/level/tilt uncertainty is explicit, and the short-shadow filter is labeled an activity rule rather than universal astronomy guidance.

Reviewed no direct solar viewing or optical concentration, no unsafe roadside/climbing sites, short outdoor intervals with shade breaks, adult cutting, stable low equipment and missing observations for cloud/unclear endpoints. The indoor near-source model is not misrepresented as a scale Sun model; lateral motion also changes lamp distance as disclosed.

Opened original Exploratorium Outdoor Shadows, Florida State University Investigating Shadows, and Harvard-Smithsonian Eyes on the Sky Chapter Two. The latter Activity 2-10 Analysis Option explicitly supports the inverse-tangent geometry. Regional seasonal claims and unsafe source variants are not imported.

Viewed all 16 actual librsvg/Cairo raster scenes, then re-viewed corrected 4–6 and 7–9 sheets. Closed findings: scissors required by high-age cutting were absent from materials; plan-view lamp movement lacked explicit plan-view/same-height labels; a schematic line was misleadingly called an actual measured line. These are corrected without new visible overlap/clipping. Diagram H/L/alpha placement and model limits agree with text.

All four shared validateAgeProtocol checks pass. Pixel evidence: `/tmp/day07-qa/manifest.json`; renderer SHA-256 `c2ccfcae94d6cd5f136921a9e9a1060edc6d6f1e97427187d65f2ca1f3f94a82`.

No browser/mobile interaction, household solar/LED trial, or complete integrated regression was performed. Actual shadow clarity and site geometry remain disclosed limitations, not assumed empirical results or a blanket physical-trial prerequisite. Overall five release gates remain separate.
