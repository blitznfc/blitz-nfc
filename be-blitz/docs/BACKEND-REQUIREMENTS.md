# Blitz Backend — Implementation Requirements

Status: **Backend implementation notes — Draft v0.2** · Subordinate to `../../docs/PRD.md`. Routes and schemas below are proposals, not API contracts. Approved OpenAPI will own HTTP semantics.

## 1. Ringkasan & Tujuan

Backend NestJS menyediakan RESTful API untuk:

- **Authentication:** Login/signup dengan Better Auth (email/password), session management
- **Tag Provisioning:** Register, verify, lock, unlock NTAG215 tags
- **Business Management:** CRUD bisnis, WiFi config per bisnis
- **Admin:** Tag registry, user management (web-only, tidak di mobile)

**Boundary:** Mobile client memanggil API backend. Dokumen ini tidak menetapkan kontrak HTTP; OpenAPI yang disepakati akan menetapkannya.

## 2. Core Principles

| Principle                       | Explanation                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **No Business Logic di Mobile** | Mobile hanya consumer API. Logic (HMAC, NXP verification) di backend.                                |
| **API-First**                   | Semua fitur harus punya endpoint. OpenAPI spec sebagai contract.                                     |
| **Secure by Default**           | HTTPS, server-side authorization, input validation, rate limits, least privilege.                    |
| **Versioned Endpoints**         | Version the application API after OpenAPI review; Better Auth route compatibility must be preserved. |

## 3. Proposed API capabilities (not yet a contract)

Do not implement clients against the routes below until `openapi.yaml` exists and is reviewed. These examples are not committed path/method decisions.

### Authentication

| Method | Endpoint                     | Purpose                  |
| ------ | ---------------------------- | ------------------------ |
| `POST` | `/api/v1/auth/sign-up/email` | Email/password sign up   |
| `POST` | `/api/v1/auth/sign-in/email` | Email/password sign in   |
| `POST` | `/api/v1/auth/sign-out`      | Sign out current session |
| `GET`  | `/api/v1/auth/session`       | Get current session      |
| `GET`  | `/health` (candidate)        | Operational health check |

### Business Management

| Method   | Endpoint                  | Purpose                          |
| -------- | ------------------------- | -------------------------------- |
| `GET`    | `/api/v1/businesses`      | List businesses for current user |
| `POST`   | `/api/v1/businesses`      | Create new business              |
| `GET`    | `/api/v1/businesses/{id}` | Get business details             |
| `PUT`    | `/api/v1/businesses/{id}` | Update business                  |
| `DELETE` | `/api/v1/businesses/{id}` | Delete business (soft delete)    |

### WiFi Config

| Method   | Endpoint                                         | Purpose                        |
| -------- | ------------------------------------------------ | ------------------------------ |
| `GET`    | `/api/v1/businesses/{id}/wifi`                   | List WiFi configs for business |
| `POST`   | `/api/v1/businesses/{id}/wifi`                   | Add WiFi config                |
| `PUT`    | `/api/v1/businesses/{id}/wifi/{wifiId}`          | Update WiFi config             |
| `DELETE` | `/api/v1/businesses/{id}/wifi/{wifiId}`          | Delete WiFi config             |
| `POST`   | `/api/v1/businesses/{id}/wifi/{wifiId}/activate` | Set active WiFi                |

### Tag Provisioning (proposal; V1 registry-only signature policy)

| Method | Endpoint                                   | Purpose                                                                                     |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/tags/register`                    | Register new tag (admin only)                                                               |
| `GET`  | `/api/v1/tags/{uid}`                       | Get tag details                                                                             |
| `POST` | Candidate provisioning authorization route | Check registration, revocation, owner and active Wi-Fi; return approved operation data only |
| `POST` | Candidate provisioning confirmation route  | Idempotently confirm verified tag write                                                     |
| `POST` | Candidate admin revocation route           | Revoke tag registration (admin only)                                                        |

Do not expose generic tag lock/unlock or password-generation endpoints without a threat-model review. A provisioning response may carry narrowly scoped credentials only to an authenticated, authorized owner when required by the hardware flow; exact response is an OpenAPI decision.

V1 gate: registry membership, non-revoked status, and ownership. NXP signature may be recorded/monitored, but invalid/unavailable signature alone does not block. See `../../docs/decisions/ADR-0001-nxp-signature-v1.md`.

## 4. Request/Response Formats

### Common Headers

```
Content-Type: application/json
Authentication: Better Auth session cookies (exact native/web transport to be specified and tested)
X-Client-Version: <mobile-version>
```

### Success Response (proposal only; confirm in OpenAPI)

```json
{
  "data": { ... },
  "meta": { "timestamp": "2026-10-04T05:32:00Z" }
}
```

### Error Response (proposal only; confirm in OpenAPI)

```json
{
  "error": {
    "code": "TAG_NOT_FOUND",
    "message": "Tag with UID X not found",
    "details": { "uid": "..." }
  }
}
```

### Pagination (proposal only)

```
GET /api/v1/tags?page=1&limit=20
```

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## 5. Authentication & Authorization

- **Session-based** (Better Auth cookies)
- **Role-based:** `owner` (business owner), `admin` (web only)
- Mobile only `owner` role. Admin denied.

## 6. Security Requirements

- Rate limiting: configure after threat review; stricter rules for credential and provisioning operations
- Input validation: validated DTOs using the chosen NestJS validation approach
- SQL injection: Drizzle parameterized queries only
- Secrets: `SERVER_SECRET`, `BETTER_AUTH_SECRET` via env vars only
- HTTPS enforced di production
- CORS/origin behavior: configure and test for native clients and actual admin web origin; app bundle IDs are not HTTP origins

## 7. Database Schema (Drizzle ORM)

Define/generate the Better Auth tables in the backend from the selected adapter. The mobile repository's experimental schema is not a migration source of truth. Store business PIN encrypted with a key-management/rotation plan; sending it once over HTTPS is decided, but key handling/storage design remains open.

- `user` — Better Auth user
- `session` — Better Auth session
- `account` — Better Auth account (email/password)
- `verification` — Email verification tokens

New tables:

- `business` — Business profile (owner, PIN, created_at)
- `wifi_config` — WiFi SSID/password per business
- `tag` — Tag UID, status, ownership, optional originality signature; lock credential storage requires threat review
- `tag_event` — Audit log (provision, lock, unlock)

## 8. NFC Tag Workflow

```
1. Admin registers tag UID before sale
2. Owner creates business + PIN
3. Owner taps tag → mobile reads UID and available signature; sends eligibility request
4. Backend checks registered UID, revocation, ownership and active Wi-Fi; applies V1 registry-only signature policy
5. Backend derives operation credential server-side; response is scoped to the authorized operation
6. Mobile writes, reads back and verifies tag payload
7. Mobile confirms; backend records provisioning idempotently
```

## 9. Error Codes

| Code                 | Description                              |
| -------------------- | ---------------------------------------- |
| `TAG_NOT_REGISTERED` | UID tidak ada di registry                |
| `TAG_REVOKED`        | Tag sudah dicabut                        |
| `TAG_ALREADY_LOCKED` | Tag sudah terkunci dengan password aktif |
| `BUSINESS_NOT_FOUND` | Business ID tidak ditemukan              |
| `RATE_LIMITED`       | Terlalu banyak request                   |

## 10. Testing

- Unit tests: `vitest` di `src/**.test.ts`
- E2E: `vitest run --config ./vitest.config.e2e.ts`
- Coverage: minimum 80%

## 11. Deployment

- Build: `npm run build`
- Migrate: `npx drizzle-kit migrate`
- Start: `npm run start:prod`

## 12. OpenAPI contract status

`docs/openapi.yaml` does not exist yet. Create and review it only after confirming Better Auth mounting/session behavior, ownership/resource routes, request/response schemas, idempotency semantics, and provisioning secret exposure. Until then this document is a proposal only.

Do not generate clients or claim contract conformance before approval.

---

**Lihat juga:**

- `../../docs/PRD.md` — Shared product requirements and decisions
- `../../docs/decisions/ADR-0001-nxp-signature-v1.md` — Accepted V1 registry-only signature policy
- `AGENTS.md` — Backend architecture & Skeptic persona
