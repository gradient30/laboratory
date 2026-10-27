# Password login implementation and release gate

This change adds optional email/password sign-in alongside email-code sign-in. Account names are parent email addresses. New or passwordless users are offered a password after interactive email verification; they may skip and retain email-code access. Forgotten passwords use fresh mailbox verification, then a new password. No administrator chooses or receives a user's password.

## Credential storage and validation

- Native `node:crypto.scrypt`, N=16384, r=8, p=5, 16 MiB working memory, maxmem=32 MiB, random 16-byte per-password salt, 32-byte output, fixed versioned encoding. This is a documented OWASP scrypt tradeoff. No plaintext or reversible password encryption.
- 8–128 Unicode scalar characters, at most 512 UTF-8 bytes, no character-class requirement, trimming, silent truncation, or normalization. Ill-formed surrogate input is rejected to avoid UTF-8 aliasing. Eight characters honors the product requirement; it is not a claim of NIST single-factor minimum compliance. The UI recommends longer unique passwords.
- Built-in timing-safe comparison and equal-cost dummy KDF for unknown, inactive and passwordless identities. Generic login failure responses. Account and IP rate limits run before the KDF and store HMAC-derived keys.
- No password, hash, verification code, or full request logging. Export/public-user/admin objects expose only the boolean `hasPassword`, not the credential representation.

## Session and reset invariants

- Only an email-verified session less than 10 minutes old grants credential-setting authority. Password-authenticated and migrated sessions have no grant.
- Password writes compare user status, access version, auth version and still-live recent session inside a D1 transaction. It rotates the current cookie/CSRF and consumes that grant; all other sessions and outstanding challenges are invalidated. Sessions and pending email challenges are auth-version bound, including races.
- Same-origin and CSRF enforcement remain in place. Rate limits apply to setting as well as login.
- Audit events record only the set/reset action and user IDs, never secrets.
- Additive migration `0002_password_login.sql` adds nullable credential/grant fields and auth versions. Existing account/child data and email login continue. No resource, provider, credential, paid-plan, or access-permission change is included.

## Release gate

Draft/testing only until the owner explicitly approves production credential/migration activation. Existing hosted Worker plan and CPU budget must be verified first. Workers Free has 10 ms CPU; Paid has a much larger default. Local Miniflare wall time is not proof of hosted CPU compatibility. Do not lower the KDF work factor, upgrade a plan, or change paid resources to force a pass. Do not assume local workerd PBKDF2 allows production 600k: hosted limits may differ. The current native scrypt design must fit the actual service budget or remain unpublished.

## Sources checked 2026-10-27

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/
- https://developers.cloudflare.com/workers/platform/limits/#cpu-time
- https://github.com/cloudflare/workerd/pull/7550
