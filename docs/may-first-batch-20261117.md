# May first material-illustration batch · 2026-11-17

Baseline `566545649b4d76a85dc3a84c7c486f36d40c936c`.

Read all four-age protocols/materials/safety and reviewed 96 original renders for days121–126. Changed12 scenes:9 on day123 and3 initial-material scenes on day125. The84 others are unchanged.

## Cohesive material changes

Day123: the stirring cup, shallow salt/blank dishes, wide dish and narrow cup, and dish on a kitchen scale now have recognisable round openings, visible translucent sides, bottom edges and soft wall shading. This replaces flat rectangular cards with a consistent vessel family while retaining each original x/y/width/height envelope. The wide/narrow inner-width comparison remains at its original endpoints. The original thin stirring line gains a rounded spoon head and thicker plastic handle within its original action area. The dry kitchen scale has a distinct housing and display; the existing `Mt：实读` is not replaced with a numeric result. The weighing dish remains seated on the same scale boundary. All existing “不可食用” labels remain at their original positions. Ventilation-cover edges and their separation from the dishes stay unchanged. No liquid surface, salt grains, crystals, dryness, residue or recovery result is supplied.

Day125: three initial-material scenes now distinguish the known mung beans and known smooth stones with subdued material shading. Bean circle positions/radii remain; a short pale hilum-style mark assists recognition without adding germination structures. Each stone uses a smooth, slightly asymmetric contour within its original44×44 envelope, not an angular mineral or glass bead. This intentionally changes the generic stone contour, not actual sample data. The objects are already identified by source labels in the protocol; the artwork does not claim shape or colour proves life. White kitchen paper is no longer a green slab: a light illustrative paper texture and “湿纸，不积水”/“干纸，0毫升” cues separate setup conditions. Transparent observation-box edges and the separate E soaking cup retain source bounds and lid/reference lines. No roots, split tissues or biological outcomes were added.

## Preserved content and scope

Exact whole-scene JSON guards cover the12 targets, falling back if any source element, label or description changes. Curriculum, labels, unknown records, sample identities/counts, arrows and reference lines are retained, with the explicit drawing exceptions of the stirring spoon and known-stone contour. No real observation is encoded by material gradients. Diagrams are schematic rather than photographic or anatomically exact illustrations.

Day121 unit/measurement models,124 fraction-area geometry and126 model drawing/history references remain unaltered to avoid decorating the information under comparison. Day122 lever diagrams were not changed in this batch; this does not certify their physical apparatus representation. Day125 later observation scenes stay schematic and unspecified rather than pre-drawing successful structures. No gate, curriculum or manifest changes.

## Verification

- `node --test scripts/illustration-may-first.test.mjs`:7 passed,0 failed.
- Covers all5,840 target markers and original text; exact-source fallback; vessel bounds, warnings and cover lines; stone/bean counts/positions; dry control versus wet paper and separate E soaking; dry scale/spoon; unique instance-local SVG references.
- `node qa/scope.mjs`:5,840 compared,12 differences,days123/125 only.
- Rendered96 original scenes and32 final day123/125 scenes. Reviewed contact sheets and full-size wide/narrow-vessel and I1/I2/K/E setup images. Labels remain legible; no sample overlap or crop found. Small material notes supplement primary labels.
- Parent owns full regression, manifest capture, commit/push and deployed verification. None of those, nor child usability testing/full acceptance, are claimed done here.
