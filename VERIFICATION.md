# Verification scope — 2026-10-22

## Passed locally

- JavaScript syntax checks for app, diagram module and deployment guard.
- Content integrity: 30 experiments, 4 age modes, 480 SVG render cases, 140 normalized artwork outputs, 18 activity-source links.
- All five static files remain identical to the original reviewed snapshot, 483145 bytes in total.
- 20 deployment guard unit cases covering approved push/manual-main, PR/privileged events, non-main/tag/fork, missing switch/target/commit, different account/Worker and unexpected D1 binding.
- Structural workflow assertions: contents-read, no PR secrets, immutable official action revisions, guarded main-only deploy, environment and concurrency, pinned Wrangler lockfile.
- YAML parsing and structure validation locally.
- Wrangler lockfile generated from the pre-existing installed 4.151.3 dependency graph, then normalized successfully with `npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund`; no registry fetch or dependency lifecycle scripts were run for that operation.
- The predecessor static-only package passed Wrangler 4.151.3 `deploy --dry-run` before CI preparation. No Cloudflare endpoint or OAuth request was made for this CI preparation.

## Not established by local checks

- GitHub-hosted runner execution and dependency download. Real CI must establish this after the approved repository receives the workflow.
- Actual Cloudflare token scopes/account selection, target Worker availability, live deployment or browser rendering.
- Full security audit of pinned Actions or npm transitive dependencies.

The workflow is intentionally disabled until both source policy and repository enablement variable are approved. Initial upload can run no-secret checks but must not deploy.
