# Zero Evaluation: Cloud Deployment Plan (Supabase + Vercel)

**Status:** Phase 1 done (spike passed), Phase 2 next · **Date:** 2026-11-10 · **Branch:** `ccr-c5b993d1-g22dsv`

**Decisions taken (2026-11-10):** the app is for the owner only, Supabase stays on the Free plan, and there is no local data to migrate, so the cloud database starts empty and Phase 4 is skipped. The app runs fully in the cloud: no step needs the owner's laptop, because the owner's tasks happen in the Supabase and Vercel dashboards in a browser, and code changes go through cloud coding sessions.

## 1. Goal

The goal is to run Zero Evaluation in the cloud so that it works from any device without a local PostgreSQL server or a running laptop. The database moves to Supabase, while the Next.js frontend and the Express backend run on Vercel. The plan keeps the existing code, Prisma schema and custom login (JSON Web Token, JWT) because a rewrite would add weeks of work without giving the user anything new. Everything in this plan fits inside the free tiers of both services, and Section 9 explains when paying makes sense.

## 2. Current state

The application builds and runs again on branch `ccr-c5b993d1-g22dsv`, where 27 end-to-end API checks and a browser check of all 22 pages pass. However, several findings from the review and from the existing cloud setup shape this plan:

- **The existing Vercel project does not run the app.** Project `zero-evaluation-app` deploys every push to `main` and shows `READY`, but each production build finishes in about 4 seconds with no framework detected and no environment variables. A real Next.js build takes minutes, so these deployments contain the repository files, not a working app. The project also runs in region `iad1` (US East), far from Jakarta.
- **Vercel Authentication protects every deployment of that project** except custom domains. Only someone logged in to the owner's Vercel account can open it today.
- **The GitHub repository is public.** Any database backup stored in GitHub must therefore be encrypted, and secrets must never be committed.
- **The in-app export and import do not cover all data.** Export skips `Budget` and the seven Safety Kit tables, and import also skips `Quiz` and `QuizAttempt`. The data migration must therefore use `pg_dump`, not the app's own export.
- **About ten lines of date logic still used the server clock** (fixed in Phase 1). Reports built month boundaries in server-local time, which pulled the last day of the previous month into a report on a server set to Western Indonesia Time (WIB), and the Safety Kit treated an item expiring today as already expired. Vercel runs in Coordinated Universal Time (UTC), where the reports happen to be correct, so this was mainly a local bug, but the same `backend/src/utils/date.ts` helper now makes both correct on any server.
- **Write endpoints accept the raw request body.** A logged-in user can set fields such as `userId` on their own records. This matters little for a single-user app with registration closed, but it must be fixed before other people get accounts.

## 3. Target architecture

```
Browser (any device)
   │  HTTPS
   ▼
Vercel project "zero-evaluation-app"   frontend/  Next.js 16   region sin1
   │  /api/* rewrite, server side (BACKEND_URL)
   ▼
Vercel project "zero-evaluation-api"   backend/   Express as a Vercel Function   region sin1
   │  Prisma 6 → Supavisor transaction pooler, port 6543 (DATABASE_URL)
   ▼
Supabase project "zero-evaluation"     PostgreSQL   region Southeast Asia (Singapore)
   ▲
   └─ Prisma Migrate → session pooler, port 5432 (DIRECT_URL), production builds only
```

All three parts run in Singapore, which is the closest region to Jakarta on both platforms, so each page load needs only short network hops. The browser only ever talks to the frontend domain, because Next.js forwards `/api/*` to the backend on the server side. As a result, the backend needs no browser-facing Cross-Origin Resource Sharing (CORS) setup, and the database is never exposed to the browser.

### Options considered

| Option | Verdict | Reason |
|---|---|---|
| A. Vercel frontend + Vercel backend function + Supabase | **Recommended** | It costs nothing, needs the fewest code changes and uses one dashboard for both apps. Functions start in a moment instead of waking a sleeping container. |
| B. Vercel frontend + Fly.io backend + Supabase | Fallback | `backend/fly.toml` already targets Singapore, so this is the backup if Express on Vercel fails the spike in Phase 1. It needs a credit card and costs a few dollars per month. |
| C. Render free tier for the backend | Rejected | Free instances sleep when idle, so the first request of the day becomes slow, which is a poor fit for a daily tracker. |
| D. Full Supabase (supabase-js, Supabase Auth, RLS) without Express | Rejected | It means rewriting 21 route groups and writing Row Level Security (RLS) policies for 37 tables, with no new benefit for the user. |

Supabase Auth stays out of scope for now. It becomes worth it only when the app needs password reset emails, social login or several users, and the current JWT login keeps working until then.

## 4. Decisions needed

Each decision has a default, and the plan follows the default unless the owner chooses otherwise.

1. **Who uses the app?** Default: only the owner. Registration is then closed after the owner's account exists. If other people will use it, Zod validation on all write endpoints, login rate limiting and password reset become required before launch.
2. **Supabase plan.** Default: Free, plus an encrypted daily backup that the plan sets up itself. Supabase Pro costs 25 USD per month and adds 7 days of managed backups and removes the inactivity pause.
3. **Repository visibility.** Default: stays public, which is safe because secrets live only in Vercel, Supabase and GitHub Actions secrets. Making it private is still an option and costs nothing.
4. **Existing local data.** Default: the owner's laptop database is migrated with `pg_dump` (Phase 4). If there is no data worth keeping, Phase 4 is skipped.
5. **Vercel login wall on the frontend.** Default: keep Vercel Authentication on during setup, because it hides the app from everyone else. At go-live the owner decides whether to keep it as an extra lock, which requires being logged in to Vercel on each device, or switch it off and rely on the app login.

## 5. Implementation phases

### Phase 1: Code preparation (done by Claude on the branch)

1. **Spike: Express as a Vercel Function.** Guard `app.listen()` in `backend/src/server.ts` so it only runs outside Vercel, keep `export default app`, and add `backend/vercel.json` with region `sin1`. Deploy one preview and confirm that `/api/health` returns 200. The backend compiles to CommonJS (`module: NodeNext` without `"type": "module"`), so this spike is where a module-format problem would show up. If the spike fails, switch to Option B and keep everything else in this plan.
2. **Prisma connection.** Add `directUrl = env("DIRECT_URL")` to the datasource in `schema.prisma`. Stay on Prisma 6, because Prisma 7 changes how the direct URL is configured, and that upgrade should be its own change.
3. **Safe migrations.** Add a `vercel-build` script that always runs `prisma generate` and a type check, but runs `prisma migrate deploy` only when `VERCEL_ENV` is `production`. This stops a preview deployment from changing the production schema. In addition, the database variables exist only in the Production environment (Section 6), so a preview deployment cannot reach the database at all.
4. **Registration switch.** Add an `ALLOW_REGISTRATION` environment variable. When it is `false`, `POST /api/auth/register` returns 403 and the register page shows that sign-ups are closed.
5. **Protected fields.** Strip `id`, `userId`, `createdAt` and `updatedAt` from request bodies in `crud.service.ts` and in the six custom controllers that pass `req.body` to Prisma (daily log, IELTS, reflection, workout, safety kit and Master's prep). Full Zod validation follows only if Decision 1 opens the app to other users.
6. **Remaining timezone bugs.** Move the server-clock date logic listed in Section 2 to `utils/date.ts`.
7. **Row Level Security migration.** Add a Prisma migration that enables RLS on every application table, including `_prisma_migrations`, with no policies. Prisma connects as the table owner, which bypasses RLS, so the app keeps working, while any request through Supabase's public Data API is denied.
8. **Smoke test in the repository.** Commit the end-to-end check used during the repair as `scripts/smoke-test.mjs`, configurable with `BASE_URL` and test credentials, so it can run against the cloud deployment.
9. **Small cleanups.** Remove the dead "Forgot password?" link and rename `middleware.ts` to `proxy.ts`, which Next.js 16 asks for.

**Done when:** both apps build, the local smoke test passes, the preview spike returns 200 on `/api/health`, and the branch is merged into `main` through a pull request.

**Result (2026-11-10):** steps 2 to 9 are done and verified locally. The smoke test passes 32 of 32 checks against the production builds with RLS enabled, a non-owner database role sees 0 rows while the app's role sees all of them, closed registration returns 403, and with `VERCEL` set the backend exports the app without opening a port. The Vercel spike (step 1) also passed: Vercel project `zero-evaluation-api` (root `backend`, Express preset) serves `/api/health` with 200 and unknown routes with the app's own JSON 404 from a function in `sin1`. Two lessons came out of it. First, Vercel made the very first deployment of the new project a production deployment even though it came from a branch, and the build correctly stopped at `prisma migrate deploy` because no database is configured yet. Second, the project defaulted to Node 26 and ignored the version set through the API, so `backend/package.json` now pins `"engines": { "node": "22.x" }`.

### Phase 2: Supabase setup (owner, about 20 minutes)

1. Create a Supabase project named `zero-evaluation` in region Southeast Asia (Singapore), and store the database password in a password manager.
2. Turn off the Data API in the project's API settings, because the app never uses it and every table would otherwise be reachable with the public anonymous key.
3. Open the dashboard's **Connect** panel and copy two strings: the transaction pooler (port 6543) and the session pooler (port 5432). The plan uses the session pooler instead of the direct connection for migrations, because the direct connection can require IPv6 and the pooler is the safer choice from Vercel. The Connect panel states which connections support IPv4.
4. Paste both strings straight into Vercel in Phase 3, not into chat or any file in the repository.

**Done when:** the project exists, the Data API is off, and both connection strings are stored in Vercel.

### Phase 3: Vercel setup (Claude through the connected Vercel account; the owner enters secrets)

1. **Frontend:** reconfigure the existing project `zero-evaluation-app` to root directory `frontend`, framework Next.js and function region `sin1`.
2. **Backend:** create a new project `zero-evaluation-api` from the same repository with root directory `backend` and region `sin1`. Set its Deployment Protection so that the production domain is public, because the frontend's server-side rewrite cannot pass a Vercel login. The backend's own JWT check still protects every data route, and the first check in step 5 confirms that the frontend can reach the backend.
3. **Environment variables:** the owner enters the values in Section 6. `BACKEND_URL` must exist before the frontend builds, because Next.js resolves rewrites at build time.
4. **First production deploy:** merge to `main`. The backend build runs `prisma migrate deploy` against the empty Supabase database.
5. **Verification on an empty database:** with `ALLOW_REGISTRATION=true`, run `BASE_URL=<backend production URL> node scripts/smoke-test.mjs`. The backend URL is used because the frontend stays behind Vercel Authentication during setup, while the backend's production domain is public and serves the same `/api` routes. A second run with `BASE_URL=https://zero-evaluation-app.vercel.app` and `VERCEL_BYPASS_TOKEN` set also checks the frontend proxy, if a bypass token is created. The script creates two throwaway accounts and prints a `DELETE FROM users ...` statement at the end. Run that statement in the Supabase SQL editor, which removes both accounts and all their data by cascade. Then check Supabase's Security Advisor, which should report no errors.

**Done when:** the smoke test passes on production, Security Advisor is clean, and the database holds no test data.

### Phase 4: Data migration from the laptop (skipped: no data to migrate)

This phase is kept for reference in case local data appears later.


The schema already exists in Supabase after Phase 3, so only the data moves. The dump leaves out the migration history table, because Supabase already has its own copy.

```bash
# On the laptop: dump data only from the local database
pg_dump --data-only --no-owner --no-privileges \
  --exclude-table=_prisma_migrations \
  --dbname "postgresql://USER:PASSWORD@localhost:5432/LOCAL_DB" \
  --file zero-eval-data.sql

# Load it into Supabase through the session pooler (DIRECT_URL), all or nothing
psql "SESSION_POOLER_URL" --single-transaction --file zero-eval-data.sql
```

After loading, compare row counts per table on both sides with `SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;`, then log in and check the dashboard against the laptop version. The dump file contains all personal data, so it is deleted after a successful load.

**Done when:** the row counts match and the dashboard shows the same history as the laptop.

### Phase 5: Go-live hardening (owner and Claude, about 15 minutes)

1. Set `ALLOW_REGISTRATION=false` and redeploy the backend.
2. Make sure `JWT_SECRET` is a fresh 64-byte random value, not the example value.
3. Decide on the Vercel login wall (Decision 5).
4. Optionally add a custom domain. A custom domain is public by default even while Vercel Authentication protects `*.vercel.app`.

### Phase 6: Operations

1. **Backups:** a GitHub Actions workflow runs `pg_dump` every day, encrypts the file with `age` using a public key, and stores it as a workflow artifact. The matching private key is kept only in the owner's password manager, not in the repository or in GitHub secrets. Encryption is required because the repository is public. The `pg_dump` client version must match the Postgres major version shown in the Supabase dashboard.
2. **Inactivity pause:** free Supabase projects pause after one week without activity. Daily use of the app keeps the project active, and Supabase's documentation says a few requests a day is usually enough, although it is not a guarantee. If the project does pause, it is restored from the dashboard without losing data.
3. **Monitoring:** Vercel function logs show backend errors, and the Supabase dashboard shows database size against the 500 MB free limit.

## 6. Environment variables

| Project | Variable | Value | Notes |
|---|---|---|---|
| zero-evaluation-api | `DATABASE_URL` | Transaction pooler URL, port 6543, with `?pgbouncer=true&connection_limit=1` | Used for queries. `pgbouncer=true` turns off prepared statements, which the pooler does not support. |
| zero-evaluation-api | `DIRECT_URL` | Session pooler URL, port 5432 | Used only by Prisma Migrate. |
| zero-evaluation-api | `JWT_SECRET` | A random string of at least 64 characters from a password manager's generator | No local tools are needed. Never reuse the example value. |
| zero-evaluation-api | `JWT_EXPIRES_IN` | `7d` | Same as today. |
| zero-evaluation-api | `NODE_ENV` | `production` | Hides internal error details. |
| zero-evaluation-api | `FRONTEND_URL` | `https://zero-evaluation-app.vercel.app` | Used by the CORS setting. |
| zero-evaluation-api | `ALLOW_REGISTRATION` | `true` during setup, then `false` | Added in Phase 1. |
| zero-evaluation-app | `BACKEND_URL` | Production URL of `zero-evaluation-api` | Must be set before the frontend build. |

All variables go in the Production environment only, so no preview deployment can reach the database.

## 7. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Express does not deploy cleanly as a Vercel Function (entry file name or module format) | Phase 3 is blocked | Run the Phase 1 spike first, and fall back to Fly.io (Option B), which already has a config. |
| A preview build runs migrations against production | The production schema changes unexpectedly | Run migrations only when `VERCEL_ENV=production`, and keep database variables out of the Preview environment. |
| Supabase Data API exposes the tables | Personal data could be read with the anonymous key | Turn off the Data API, enable RLS on every table, and check Security Advisor. |
| No managed backups on the Free plan | Data loss after a mistake | Encrypted daily `pg_dump` in GitHub Actions, or Supabase Pro. |
| The Free project pauses after a week idle | The app is offline until restored | Daily use plus the backup job, and a restore from the dashboard if needed. |
| Server-clock date logic | Wrong "today" or wrong period boundaries | Fixed in Phase 1 with `utils/date.ts`, and the smoke test checks dates against the Jakarta calendar. |
| Open registration on a public URL | Strangers can create accounts | Set `ALLOW_REGISTRATION=false` at go-live. |
| A secret is committed to the public repository | Full database access for anyone | Keep secrets only in Vercel and GitHub secrets, use `.env` (already in `.gitignore`), and rotate the database password immediately if a leak happens. |
| Slow first request after idle (function cold start) | A short delay on the first page load | Acceptable for personal use, and the response time is measured during Phase 3. |

## 8. Out of scope

This plan does not include the Prisma 7 upgrade, the Zod 4 upgrade, Supabase Auth, password reset emails, or making the app multi-user. Each of these is a separate change. The multi-user work becomes required only if Decision 1 changes.

## 9. Cost

The default setup costs 0 USD per month: Vercel Hobby covers personal, non-commercial projects, and Supabase Free covers one 500 MB database. The first paid step worth considering is Supabase Pro at 25 USD per month, which adds managed daily backups and removes the inactivity pause. If the app ever becomes a commercial product, Vercel Pro is also required by Vercel's Hobby terms.

## 10. Sources

- Vercel, Express on Vercel: https://vercel.com/docs/frameworks/backend/express
- Vercel, project configuration and regions (Hobby can choose one region): https://vercel.com/docs/project-configuration/vercel-ts
- Prisma, Supabase guide: https://prisma.io/docs/guides/database/supabase
- Supabase, Prisma guide: https://supabase.com/docs/guides/database/prisma
- Supabase, Prisma troubleshooting (prepared statements and the pooler): https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting
- Supabase, free project pausing: https://supabase.com/docs/guides/platform/free-project-pausing
- Supabase, pricing: https://supabase.com/pricing
- Supabase, production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase, hardening the Data API: https://supabase.com/docs/guides/api/hardening-data-api
