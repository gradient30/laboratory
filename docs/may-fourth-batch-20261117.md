# May fourth batch: days 139–144

Baseline: c92d277664f8dae0391a9339ad11362eeaf906cc. Reviewed all four age protocols (materials, actions and safety) and original 96 scene PNGs. This is an incremental vector-material clarity pass, not photorealistic artwork or full acceptance.

## Actual changes: 11 scenes

- Day 139: four initial setup scenes. Former solid green areas now show a transparent plastic tray/box rim and inset white moist-paper surface. The 4/8/8/12 original circles become green mung beans with small hilum cues, retaining each center/radius and all IDs/grid boundaries. Individual trays remain separate; the oldest group's archive tray remains empty. Later observation/classification scenes are unchanged: no roots or germination outcomes added.
- Day 141: seven physical setup/touch scenes. Seven single-layer sponges gain an inset top and side face without increasing the original envelope or changing bottom support. All 56 original pores retain positions/radii. Nine empty collection bowls gain transparent wall/bottom shape; seven mesh supports and two flat silicone pieces are distinguished. Original support geometry, low pouring arrows, transfer arrows, clock timing, target-dose cards and labels remain unchanged. No collected water or retained amount is prefilled.

## Intentionally preserved

Days 140, 142, 143 and 144 are unchanged. Day 140 is explicitly a paper teaching model, not a bronze object; day 142 models borrowing records; day 143 uses meaningful motion boundaries; day 144's dots/water relationships are experimental inputs. Decorative changes could confuse source/evidence or measured boundaries. Day 139 later schematic observation states stay schematic; day 141 bookkeeping/result cards stay blank/conditional.

## Verification

- `node --test scripts/illustration-may-fourth.test.mjs`: 5/5 passed. Exact whole-scene guards, mutation fallback, full original text preservation, bean counts/centers/radii, sponge/bowl/pores counts, source support lines and bounds, valid unique gradient IDs.
- `node qa/scope.mjs`: 5,840 scene comparison, exactly 11 outputs changed, only days 139 (4) and 141 (7).
- Original 96 PNG contact reviewed; revised 32 PNG contact and youngest day 141 setup enlarged reviewed. No newly apparent clipping, label overlap, fake water outcomes or loss of full-bottom support.
- Not run here: full repository regression, production deployment or browser interaction. Parent owns these stages. No curriculum, manifest, deployment gate, commit or push changes.

## Follow-up: external numbering ambiguity

For the 4–6 and 7–9 initial setups, the original grid-position numbers could be mistaken for writing on wet paper. Added small label-tab backgrounds at the same number positions and an explicit leader/callout: 编号贴在透明盖外侧 / 不写在湿纸上. This preserves seed/number/grid positions and the prescribed external numbering rather than moving or writing into the sample. Original protocol text is unchanged. Both enlarged final PNGs reviewed for label/seed separation and legibility. Target tests now 6/6; refreshed 5,840 comparison still exactly 11 changed scenes. Full regression and candidate fingerprint must be rerun after this follow-up.
