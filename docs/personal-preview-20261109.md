# Candidate-specific early release

This optional workflow route is an owner-authorized early release, not a final reviewed release. The label `personal-preview-20261109` does **not** make the site private: existing public endpoints, registration settings, account permissions and data isolation are unchanged.

## Selection and scope

The default `standard` route remains unchanged in its requirements. Pull requests and main pushes use it and still require browser checks and all five final joint reviews. Only an explicit manual `workflow_dispatch` on `main` in `gradient30/laboratory`, choosing `personal-preview-20261109`, can select the exception.

Every job validates the source and data SHA-256 against `docs/personal-preview-20261109.json`. Any source/data change invalidates that declaration. The declaration is outside the existing release-source fingerprint to avoid a self-reference; changing the declaration does not grant a permanent bypass. A later candidate needs a new deliberate declaration and assessment. No standard final-review evidence is added or changed.

## Deferred, not passed

- Browser flows for this exact candidate remain unrun.
- All five final joint reviews remain deferred and unverified: specification, facts, quality, regression and user-feedback.
- Structural protocol validation is not scientific, safety, age-fit, visual or user-acceptance approval.

The job summary explicitly records these limits and the candidate fingerprints. A successful early-release job is not evidence that deferred checks passed.

## Requirements kept

The preview still requires 365 activities and 1,460 structurally valid independent age protocols, frozen identities, syntax checks, full Node/account/backend tests, deterministic asset build and Wrangler package dry-run. It keeps the existing production environment, kill switch, exact repository/main/account/Worker/D1 deployment guard, existing AUTH_SECRET metadata/name-only checks, recovery bookmark, additive migrations before deployment, action/dependency pins and read-only repository permissions. It does not change credentials, account access, branch protection, public registration settings or recovery policy.

The existing secret-bearing deployment step remains unchanged. A failed selector cannot emit a browser-skip output. A malformed or missing declaration fails closed.

## What this patch does not establish

Local tests do not execute GitHub Actions, verify remote configuration, migrate live D1 data or deploy the Worker. Applying a local patch is not publication. Confirm the exact remote commit and actual workflow/deployment result separately before claiming a release.

## Lean packaging revision — 2026-11-12

The owner requested omitting verification images for personal use. The verification directory is excluded from this candidate. Its 366 archived-image checks have been moved out of the common npm test command into test:visual-evidence, which is mandatory for standard releases and omitted only for the explicitly selected personal preview. They are NOT counted as passed for this lean candidate. Standard browser and five-review requirements remain unchanged; the standard route cannot pass without the omitted evidence being restored. Runtime code, curriculum data, printable paper resources, account isolation, secrets and migration safeguards are unchanged. The exact-candidate source fingerprint was recalculated for this revision. This is a new locally checked candidate, not a completed deployment.

## Source transport revision

Four large JSON inputs are stored as <=300,000-byte raw pieces encoded in base64. Every part, the manifest and the reconstructed file are hash-pinned. npm run prepare:source runs before all Actions release selectors and asset builds. Reconstructed bytes are identical to the original candidate. Changed local authoring inputs cause an error instead of being overwritten. Source transport parts are not public runtime assets.

## A4 print and password-save revision — 2026-11-13

Adds a read-only current-age print preview with all materials, four complete operations, safety emphasis and discovery writing space. It targets A4 at 100% scale, fitting down to 9pt; longer content retains automatic continuation pages rather than clipping. Dimension-sensitive paper templates remain separate. Setting a password now preserves the current session object's identity so in-flight progress callbacks are not invalidated solely by that credential update.

The exact candidate passed JavaScript syntax, 1,469 script tests and 146 backend tests, deterministic asset checks and Wrangler deploy dry-run. Three print tests cover all 1,460 age-specific materials/operations and escaping/fitting behavior. Native Chromium could not launch because socket creation was denied, including the permitted escalation attempt. Browser flows, actual PDF layout and all five final reviews remain UNVERIFIED; new Playwright regression cases are supplied, not claimed as passed. No workflow, production permission or standard-release requirement is changed.
