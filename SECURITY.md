# Security

## Secrets

- Keep the Clerk keys and `DATABASE_URL` in the environment of the host, never in the repo.
- `.env` files are ignored by git. Only `.env.example` is tracked, and it holds placeholders for local development.
- `AUTH_MODE=demo` does not authenticate anyone. It only works under `next dev`, and a production server refuses it.
- If a key leaks, rotate it in Clerk or in the database provider right away.

## What the app does

- The user id comes from the Clerk session on the server. No route takes an owner id from the body, the query string or a header.
- Every query filters by that owner, and the foreign keys between tables include the owner too.
- Writes check that `Origin` (or `Referer`) is the app's own origin and answer `403` otherwise.
- Writes are rate limited per account: 120 a minute for `/api/workspace`, 30 for `/api/archive` and `/api/card-fonts`. The answer is `429` with `Retry-After`.
- Bodies have a size cap (4 MiB, 8 KiB and 32 KiB by route) and are validated with Zod. A card body is limited to 20,000 characters and a title to 300, in Zod and in the database.
- SQL uses parameters. The collection is saved in one transaction with an optimistic revision check.
- Responses carry a Content Security Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict `Referrer-Policy`, a `Permissions-Policy` and, in production, HSTS.
- `pnpm audit --prod` runs in CI. It reports no known vulnerabilities today.

## Limits

- The rate limiter lives in process memory. On a serverless host each instance counts for itself, so the limit is per instance, not global. A shared store (Redis, for example) would fix that.
- The CSP keeps `'unsafe-inline'` for scripts and styles because Next.js injects inline scripts for hydration. A per-request nonce would remove it but would make every page dynamic.
- There is no account export or deletion flow yet. Deleting a user in Clerk leaves their rows in the database.
- No third-party API, API keys or webhooks.
- Each autosave sends the whole collection, so a very large collection costs more bandwidth than a diff would.

## Reporting a problem

Open a private security advisory on the repository, or write to the owner before publishing any detail.
