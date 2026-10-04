# Supabase → NestJS migration checklist

Status: **Planning only — no remote database changes authorized or performed**

Update 2026-10-04: Mobile Supabase client runtime is disabled and `@supabase/supabase-js` removed. Legacy schema/migration files remain preserved. Prisma ORM is installed in NestJS, but no models, database connection, migration, or data migration have been applied.

## Current facts

- Product auth/API owner is Better Auth inside NestJS; mobile and admin clients call NestJS.
- `mobile/src/lib/api.ts` and `mobile/src/lib/supabase.ts` are compatibility stubs that fail closed; no direct Supabase operations should remain active in the app.
- Mobile has a Supabase migration and schema/types. They may represent prior desired/actual data and must be inspected before removal or migration.
- Supabase project access via the local CLI was previously insufficient. Do not assume the target project is accessible or that local files match remote schema/data.
- Supabase may remain the managed PostgreSQL host. This is distinct from using Supabase Auth, Data API, or Edge Functions.

## Safe cutover sequence

1. **Inventory and protect data**
   - Identify the exact Supabase project/database and its owner/access path.
   - Inspect remote table/column definitions, constraints, indexes, RLS, policies, triggers, and row counts/read-only samples.
   - Confirm whether any real user/business/Wi-Fi/tag data exists and who owns the backup.
   - Take and verify a restorable backup before schema changes or deletion.
2. **Choose Supabase's remaining role**
   - Either retain it only as PostgreSQL hosting for NestJS, or select another PostgreSQL host.
   - Do not delete the project, migrations, schema, or data during the client cleanup.
3. **Establish backend schema**
   - Define Better Auth and product tables in the backend using Prisma ORM.
   - Compare desired schema against the verified remote schema; write reviewed, additive/compatible migrations first.
   - Design authorization/isolation explicitly; RLS may be defense-in-depth, but do not invent policies before choosing whether DB access is direct service role or user-scoped.
4. **Move server behavior**
   - Implement auth, business/Wi-Fi access, tag registry, audit events, and provisioning decisions in NestJS.
   - Add integration tests and verify tenant/owner isolation, retries, and sensitive data handling.
5. **Cut mobile over by feature**
   - Replace direct `src/lib/api.ts` data paths with typed calls to the reviewed NestJS OpenAPI contract.
   - Use Better Auth Expo client against the NestJS auth endpoint and verify secure cookie/session transfer on actual native clients.
   - Keep NFC driver in mobile; server remains authoritative for permission and derived tag credentials.
6. **Remove legacy code only after evidence**
   - Search references and build/test after each replacement.
   - Remove `@supabase/supabase-js`, stale server auth/Drizzle/`pg` packages, old API client, types, migration drafts, and example environment variables only when no active imports or migration needs remain.
   - Keep a clearly marked historical migration/backup if needed for data audit; do not leave old runtime code callable.
7. **Closeout**
   - Verify mobile contains no direct Supabase data calls or server secrets.
   - Verify NestJS connects to the intended database and passes migrations/integration tests.
   - Run mobile and backend lint/typecheck/tests/build; test sign-up/sign-in/session expiry and provisioning on supported hardware.
   - Remove Supabase credentials from mobile `.env.example`; configure database credentials only in backend secret storage.

## Cut now vs later

**Can stop using now:** Supabase client calls from new mobile features; Expo-hosted Better Auth/API server plan; mobile-side database/business authorization logic.

**Do not delete yet:** Supabase project, remote tables/data, `supabase/migrations/001_init_schema.sql`, schema/types, or all `pg`/Drizzle packages before backend schema, backups, migration state, and references are verified.

## Deferred decision

Record Supabase's final role in `../PRD.md` after confirming project ownership/access and selecting the production Postgres host. Current safe default: preserve the existing Supabase project and treat it as a possible Postgres host, not as the client auth/API layer.
