# Blitz NFC

Blitz is an NFC Wi-Fi sharing product with a mobile owner app and a centralized NestJS backend. A web admin client is planned.

## Workspace

- `mobile/` — Expo iOS/Android client: UI, NFC hardware, and API consumption only.
- `be-blitz/` — NestJS backend: auth, authorization, product logic, Prisma/PostgreSQL access.
- `web-admin/` — planned admin web client.
- `docs/PRD.md` — shared product requirements source of truth.
- `docs/AI-ORCHESTRATION.md` — cross-project agent workflow.

See root `AGENTS.md` for ownership, document precedence, security rules, and verification gates. Database credentials belong only in the backend runtime environment. No remote schema migration has been applied as part of this setup.
