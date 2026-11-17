# April final visual batch · 2026-11-17

Baseline: `39958c94472f994bbd7491b356fe7be3334d5eac`.

Reviewed days115–120: all four-age protocols, materials/safety and the96 original scene renders. This patch changes12 scenes:10 on day118 and2 on day120. The84 others are unchanged.

## Material and instructional improvements

### Day118: white paper, not a pool of water

The original wet-paper bed was a solid water-blue rectangle and the dry control a yellow rectangle, although the protocols specify the same white kitchen paper, wetted without standing water. Both now read as white kitchen paper with subtle repeated illustrative fibre texture and a thin lower layer edge. Wet paper has a very pale cool tint and the explicit setup cue “湿纸，不积水”; dry paper says “干纸，0毫升”. Both remain inside the same original box and paper bounds. Transparent shallow-box edges have a soft material gradient, top highlight and lower rim. This is a cohesive box/paper depiction rather than an isolated icon change.

The six-box13–16 initial scene remains all dry before wet-group treatment. The later W/D demonstration still depicts one of three pairs, as its original label says. No seed, root or actual observation was added; original sample circles, root lines, action arrows, labels and pending records remain unchanged. Texture is illustrative paper material, not recorded contamination or microscopic fibres. The liquid measuring block in the youngest preparation scene remains distinct from the paper bed.

### Day120: recognise a closed plastic bottle

The7–9 preparation/observation diagrams previously looked like rectangular lidded boxes. Each now has a narrowed neck, rounded shoulders, fitted screw cap with grip lines, translucent side shading and a stable bottom. Overall original bounding extent and bottom position are retained; bottle outlines are intentionally changed, not claimed geometrically identical. Two bottles remain two, original group labels and100mL text stay intact. No external droplets, mist, liquid levels or other observation results are drawn. The abstract water-reservoir route diagrams remain untouched.

## Preserved scope and limitations

Whole-scene JSON guards protect all12 targets; any source mutation falls back to the existing renderer. Day115 lever diagrams and day116 filtration setup were not modified in this batch; this does not certify their physical setup as fully depicted. Day117 fractional units and day119 evidence/occlusion line drawings were not decorated because their geometry and information are the objects being compared. No curriculum, safety, manifests or release gates changed.

These remain schematic vector illustrations, not photography or fully realistic plant anatomy. Original circles representing beans and illustrative root structures remain; outcome fields must still be filled from actual observation. No child usability study or full formal acceptance is claimed.

## Checks performed

- `node --test scripts/illustration-april-final.test.mjs`:6 passed,0 failed.
- Guards, original text, all original circles/root and arrow coordinates, dry/wet paper roles and bounds, measuring-block separation, sealed bottle count/extents, absence of added observations, instance-local gradient/pattern IDs covered.
- `node qa/scope.mjs`:all5,840 scenes compared;12 differences, exclusively days118/120.
- Rendered all96 originals, then32 day118/120 images and contact sheet. Inspected full-size six dry boxes and bottle preparation, plus complete updated contact sheet; no clipped labels or sample overlap found. Small setup captions supplement rather than replace existing primary text.
- Full regression, manifest capture, commit/push and deployment remain parent responsibilities; none are claimed completed here.
