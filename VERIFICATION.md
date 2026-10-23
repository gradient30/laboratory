# Verification scope — 2026-10-23

## Passed locally

- JavaScript syntax checks for app, diagram module and deployment guard.
- Content integrity: 30 experiments, 4 age modes, 480 SVG render cases, 140 normalized artwork outputs and 18 activity-source links.
- All five static files remain identical to the reviewed snapshot, 483145 bytes in total.
- 24 deployment guard cases: approved push/manual-main; unset optional switch; explicit false and invalid switches; disabled source policy; rejected PR/privileged events, non-main/tag/fork, wrong account/Worker, missing target/commit and unexpected D1 binding.
- Workflow assertions: contents-read, no PR secrets, exact official action revisions, checked-source policy output, optional fail-closed repository kill switch, main-only deployment after successful checks, environment/concurrency, locked Wrangler 4.151.3.
- YAML parsing and source-policy output validation.

## Verified GitHub-hosted checks before enablement

[Run 39898361852](https://github.com/gradient30/laboratory/actions/runs/39898361852) checked commit `c1761c407014fdb38bf1f1c35705c45517f51770`: dependency installation, syntax, tests and Wrangler dry-run succeeded; deployment was skipped. This proves the previous check-only workflow, not a live Cloudflare deployment.

## Authorized enablement

The owner expressly authorized main automatic publication and the first deployment on 2026-10-23. The source policy remains the required enablement gate. The optional repository variable may stop deployment: unset or `true` permits an enabled source policy, while `false` and other nonempty values block. Source-policy changes are staged last; no secrets are needed by the check job.

## Evidence still required for a deployment result

- Successful deploy job for the exact final commit, actual Cloudflare version and URL.
- Browser checks of that deployed URL; a dry-run is not browser QA.
- Token scope correctness is not established by local tests. Do not broaden scope or select another account to work around an authorization failure.
- These checks are not a complete audit of Actions or npm transitive dependencies.
