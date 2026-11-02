# Password login implementation and release gate

This change adds optional email/password sign-in alongside email-code sign-in. Account names are parent email addresses. New or passwordless users are offered a password after interactive email verification; they may skip and retain email-code access. Forgotten passwords use fresh mailbox verification, then a new password. No administrator chooses or receives a user's password.

## Credential storage and validation

- Internal `PasswordHasher` Durable Object RPC runs native `node:crypto.scrypt`, N=16384, r=8, p=5, 16 MiB working memory, maxmem=32 MiB, random 16-byte per-password salt, 32-byte output, fixed versioned encoding. This is a documented OWASP scrypt tradeoff. No plaintext or reversible password encryption.
- 8–128 Unicode scalar characters, at most 512 UTF-8 bytes, no character-class requirement, trimming, silent truncation, or normalization. Ill-formed surrogate input is rejected to avoid UTF-8 aliasing. Eight characters honors the product requirement; it is not a claim of NIST single-factor minimum compliance. The UI recommends longer unique passwords.
- Built-in timing-safe comparison and equal-cost dummy KDF for unknown, inactive and passwordless identities. Generic login failure responses. Account and IP rate limits run before the KDF and store HMAC-derived keys.
- No password, hash, verification code, or full request logging. Export/public-user/admin objects expose only the boolean `hasPassword`, not the credential representation.

## Session and reset invariants

- Only an email-verified session less than 10 minutes old grants credential-setting authority. Password-authenticated and migrated sessions have no grant.
- Password writes compare user status, access version, auth version and still-live recent session inside a D1 transaction. It rotates the current cookie/CSRF and consumes that grant; all other sessions and outstanding challenges are invalidated. Sessions and pending email challenges are auth-version bound, including races.
- Same-origin and CSRF enforcement remain in place. Rate limits apply to setting as well as login.
- Audit events record only the set/reset action and user IDs, never secrets.
- Additive migration `0002_password_login.sql` adds nullable credential/grant fields and auth versions. Existing account/child data and email login continue. The owner approved the exact internal `PASSWORD_HASHER` / `PasswordHasher` SQLite-backed Durable Object on 2026-11-02. No provider, credential, paid-plan or unrelated resource change is included.

## Release gate

The entry Worker does not import the KDF; it selects one of 16 fixed non-identifying shard names from the normalized email and performs internal RPC. Each object serializes hashing, with at most four running/queued calls and a five-second deadline. The class never accesses storage or external I/O, logs payloads, or exposes a public HTTP hashing route. SQLite-backed class migration `password-hasher-v1` is used solely for Workers Free eligibility. No plaintext or credential records are persisted in the object.

Missing binding, rejection, malformed results, and timeout fail closed with a generic 503. OTP login remains independent. Hashing completes before a credential mutation; fresh grant/auth/access/session CAS is checked again after RPC, so timeout or late results cannot consume a grant or mutate credentials. Rate limits run before RPC. The normal entry Worker CPU budget still must be checked; offloading is not proof that every request fits.

Source guards allow only the exact owner-approved binding/class/SQLite migration and reject extra resources or paid CPU settings. Preserve any repository deployment kill switch. Full exact-revision CI, independent review and scoped release acceptance remain gates; local CPU/wall time and synthetic tests are not hosted budget or real-email-delivery proof. Free limits must be respected without lowering KDF cost or upgrading plans. If quotas are exhausted, fail closed rather than authorize spending. Deployment must preserve existing D1 and account/child data; migration 0002 is additive. No real account/password/OTP or child records are needed for synthetic validation.

## Sources (Workers/DO limits rechecked 2026-11-02)

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/
- https://developers.cloudflare.com/workers/platform/limits/#cpu-time
- https://github.com/cloudflare/workerd/pull/7550

- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
