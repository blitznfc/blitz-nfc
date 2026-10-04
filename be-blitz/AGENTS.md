# Blitz Backend (NestJS) — AGENTS.md

**Product:** Blitz — NFC WiFi Connector Backend  
**Language:** TypeScript/NestJS  
**Database:** PostgreSQL (Prisma ORM 7.10 stable)  
**Auth:** Better Auth

## Architecture Summary

This is a **centralized backend service** for the Blitz mobile app and future admin web interface.

**Core principle:** _Everything server-side lives here. Mobile is a thin client._

| Domain                  | Responsibility                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Mobile (mobile/)**    | UI, NFC hardware interaction, offline state handling, API consumer                                               |
| **Backend (be-blitz/)** | Authentication, authorization, business logic, NFC tag provisioning API, data persistence, external integrations |

## Critical Constraints

1. **No business logic in mobile** — Mobile should only:
   - Render UI
   - Handle NFC hardware (read/write via `react-native-nfc-manager`)
   - Call backend API endpoints
   - Handle network state (retry, offline indicator)

2. **Security is server-only:**
   - Tag password derivation (`HMAC-SHA256(SERVER_SECRET, PIN ‖ UID)`) MUST be server-side
   - V1 provisioning authorization is registry/revocation/ownership-based. NXP signature may be recorded/monitored, but does not independently block V1; see `../../docs/decisions/ADR-0001-nxp-signature-v1.md`.
   - Database credentials never touch client code

3. **API-First Design:**
   - Every client-visible feature must have a reviewed API contract before implementation
   - OpenAPI is the intended contract; current endpoint examples are proposals only
   - Mobile and backend must agree on request/response shapes

## Setup & Development

### Commands

```bash
# Development server
npm run start:dev

# Production build
npm run build && npm run start:prod

# Linting (type-aware)
npm run lint

# Tests
npm run test
npm run test:e2e

# Format
npm run format

# Prisma client/schema
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
```

Prisma schema lives in `prisma/schema.prisma`; client output is generated under `src/prisma/generated/` and must not be committed. `DATABASE_URL` is backend-only. Never run a migration or introspection against the remote Supabase project until the exact target, a restorable backup, and schema ownership are verified. No Prisma models/data migration have been approved yet.

### Environment Variables (Required)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Better Auth
BETTER_AUTH_SECRET=<32+ char random string>
BETTER_AUTH_URL=http://localhost:3000

# NFC Tag Security
SERVER_SECRET=<32+ char random string for HMAC derivation>

# Supabase (PostgreSQL host)
SUPABASE_PROJECT_REF=ifdasynhgvkeznoovheb
```

## Project Structure

```
be-blitz/
├── src/
│   ├── main.ts              # Entry point
│   ├── app.module.ts        # Root module
│   ├── config/              # Environment/config handling
│   ├── modules/             # Feature modules (auth, tags, businesses)
│   │   ├── auth/
│   │   ├── tags/
│   │   └── businesses/
│   ├── common/              # Shared utilities, guards, interceptors
│   ├── dto/                 # Request/Response DTOs
│   └── db/                  # Drizzle ORM schema & client
├── test/                    # Unit & e2e tests
├── docs/                    # API specs, architecture docs
└── .agents/
    └── skills/              # Agent behavioral skills
```

## Agent Skills

| Skill                                 | Purpose                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `karpathy-guidelines`                 | **Skeptic Role** — Question assumptions, force simplicity, define verifiable success |
| `better-auth-best-practices`          | Auth setup with Better Auth + Drizzle                                                |
| `better-auth-security-best-practices` | Rate limiting, CSRF, secrets management                                              |
| `supabase`                            | Database interaction (PostgreSQL via Supabase)                                       |
| `supabase-postgres-best-practices`    | Postgres performance, indexes, RLS                                                   |

## API Design Rules

1. **Version all endpoints:** `/api/v1/...`
2. **Use HTTP status codes correctly:** 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
3. **Consistent error format:**
   ```json
   {
     "error": { "code": "TAG_NOT_FOUND", "message": "Tag with UID X not found" }
   }
   ```
4. **Paginate collections:** `/api/v1/tags?page=1&limit=20`
5. **No data leakage:** Only return fields the client needs

## Database Rules

1. **Drizzle ORM only** — No raw SQL in application code (except migrations)
2. **Migrations are source of truth** — Schema changes require `drizzle-kit generate && drizzle-kit migrate`
3. **Database isolation required** — Choose and test RLS or equivalent server-side authorization; do not assume blanket RLS before the access model is designed
4. **Indexes on FKs and query filters** — No lazy "just query it" without considering N+1

## Production security checklist

These are release gates, not claims that the current scaffold already implements them.

Before deploying ANY endpoint:

- [ ] Authentication/Authorization implemented
- [ ] Input validation (DTO/DTO class-validator)
- [ ] Rate limiting applied
- [ ] SQL injection prevented (Drizzle parameterized queries)
- [ ] Secrets not in code/logs (env vars only)
- [ ] CORS configured for mobile domain only
- [ ] HTTPS enforced in production

## Deployment

**Target:** VPS (Docker Compose or systemd service)

**Steps:**

1. Build: `npm run build`
2. Copy `dist/` to server
3. Set environment variables
4. Run migrations: `npx drizzle-kit migrate`
5. Start: `node dist/main`

**DO NOT:**

- Deploy without running migrations
- Deploy with `BETTER_AUTH_SECRET` or `SERVER_SECRET` missing
- Enable CORS for `*` in production

---

## PRD Reference

Read `../../docs/PRD.md` for product behavior. `docs/BACKEND-REQUIREMENTS.md` is subordinate implementation guidance. If they conflict, stop and report the conflict.

**Current product invariants:**

- Tags must be registered by admin BEFORE provisioning
- Tag password derived server-side only: `HMAC-SHA256(SERVER_SECRET, PIN ‖ UID)`
- For V1, invalid/unavailable NXP signature alone does not block provisioning; registry, revocation, and ownership do. See `../../docs/decisions/ADR-0001-nxp-signature-v1.md`.
- Tags are write-locked (read open)
- Mobile app is business owner only — no admin features on mobile

## Agent workflow

Follow `../docs/AI-ORCHESTRATION.md`; this file defines only project-specific constraints.
