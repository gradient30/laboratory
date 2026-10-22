# Verified action revisions

Verified on 2026-10-22 using release links on the official `actions` repositories, followed to their canonical commit pages:

| Action | Release | Immutable commit |
|---|---|---|
| actions/checkout | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |

- [checkout release](https://github.com/actions/checkout/releases/tag/v7.0.1) / [verified commit](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1)
- [setup-node release](https://github.com/actions/setup-node/releases/tag/v7.1.0) / [verified commit](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1)

Full SHA pinning prevents a moving tag from silently changing the selected action revision. It is not a complete supply-chain audit. Update pins and the local workflow assertion together in a reviewed PR. The deployment uses the npm-lockfile-installed Wrangler 4.151.3 directly, so no third-party deployment action is needed.
