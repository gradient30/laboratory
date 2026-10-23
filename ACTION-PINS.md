# Verified action revisions

Verified on 2026-10-22 using release links on the official `actions` repositories, followed to their canonical commit pages:

| Action | Release | Immutable commit |
|---|---|---|
| actions/checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |

- [checkout release](https://github.com/actions/checkout/releases/tag/v7.0.1) / [verified commit](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1)
- [setup-node release](https://github.com/actions/setup-node/releases/tag/v7.1.0) / [verified commit](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1)

Full SHA pinning prevents a moving tag from silently changing the selected action revision. It is not a complete supply-chain audit. Update pins and the local workflow assertion together in a reviewed PR. The deployment uses the npm-lockfile-installed Wrangler 4.151.3 directly, so no third-party deployment action is needed.

## Annual visual-review artifact
`actions/upload-artifact` v7.0.2 is pinned to `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (official release and commit checked 2026-10-23). The no-secret check job uploads only synthetic interface PNG screenshots under `test-results/visual-review`, retained 7 days. It does not upload traces, browser storage exports, environment files or user data.
