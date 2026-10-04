# Blitz Workspace Agent Guide

This root coordinates the independent projects in this folder. Each child keeps its own Git repository and owns its dependencies, build, and release lifecycle.

## Product source of truth

- Shared product requirements: `docs/PRD.md` (single source of truth).
- Backend requirements: `be-blitz/docs/BACKEND-REQUIREMENTS.md`, subordinate to the shared Product PRD.
- API contract: `be-blitz/docs/openapi.yaml` once created. Until then, do not treat endpoint examples in a PRD as an implemented contract.
- Project-specific rules: `mobile/AGENTS.md` and `be-blitz/AGENTS.md`.
- Future admin web: `web-admin/`; inspect its own instructions before working there.

If a child document conflicts with `docs/PRD.md`, the shared Product PRD wins for product behavior. Stop before implementation if resolving the conflict requires a product decision; record unresolved decisions in `docs/decisions/`. OpenAPI, once approved, is authoritative for HTTP details and must not contradict product behavior.

## Architecture boundaries

```text
mobile/       Expo iOS/Android owner app; NFC hardware + UI; API client only
be-blitz/     NestJS service; auth, authorization, validation, domain logic, DB, crypto
web-admin/    Admin web client; API client only; no direct database access
```

- Backend is authoritative for users, roles, business/Wi-Fi data, tag registry, provisioning decisions, tag credential derivation, and any originality-signature recording/monitoring. For V1, signature validity alone does not block provisioning; see `docs/decisions/ADR-0001-nxp-signature-v1.md`.
- Clients may own platform UI and hardware access only. Never put secrets, privileged credentials, or authorization decisions in a client.
- Clients consume the backend API. Do not create a second auth/database/business-logic implementation in mobile or web.
- Keep API contracts backward-compatible or version changes explicitly. Update OpenAPI first, backend implementation/tests second, and client consumers after.
- NFC device I/O stays in mobile. The backend authorizes and validates provisioning and returns only data needed by the authorized owner; never trust client-side validation as security control.

## Agent orchestration

The primary agent coordinates changes across repositories. Do not invent a tool/agent that is unavailable in the current host; use installed skills and available subagents only. Follow `docs/AI-ORCHESTRATION.md` for role/mode selection, skeptic review, and cross-project sequence. Do not duplicate its full workflow here.

## Quality gates

- Backend: `npm run lint`, `npm test`, `npm run build` (confirm scripts in `be-blitz/package.json`).
- Mobile: `npx expo lint`, `npx tsc --noEmit`; use SDK-matched Expo docs for Expo/RN changes. Native/NFC changes require development-build/device validation.
- Web admin: read `web-admin/AGENTS.md` and run its project-defined checks.
- Database changes: inspect current schema and migrations first; create reviewed migrations; never apply to remote database without explicit instruction.
- Report checks actually run and distinguish verified behavior from assumptions or blocked work.

## Current status

- Product decisions and blockers live in `docs/PRD.md` and `docs/decisions/`.
- Supabase-to-NestJS cleanup is staged in `docs/migrations/SUPABASE-TO-NESTJS.md`; do not delete remote DB assets or data without verified backup and explicit authorization.
- `be-blitz/docs/BACKEND-REQUIREMENTS.md` is a draft; its endpoint/schema proposals are not proof of implementation.
- Mobile still contains Better Auth/Drizzle/Supabase dependencies from an earlier experiment; migrate deliberately.
- Backend is a NestJS scaffold; DB connection and migrations are not verified.
- `web-admin/` is a placeholder.
- Never label auth, provisioning, signature policy, database security, migration, or deployment production-ready without implementation evidence and tests.
