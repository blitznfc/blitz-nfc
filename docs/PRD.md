# Blitz — Product Requirements Document

Status: **Draft for architecture alignment** · Updated 2026-10-04

This is the shared product source of truth for `mobile/`, `be-blitz/`, and the future `web-admin/`. Project-specific implementation details belong in those projects' technical docs. Proposed API examples are not API contracts; the OpenAPI document will become the contract after review.

## 1. Product vision

Blitz helps a business owner share its Wi-Fi through a physical NFC tag and QR fallback. Owners manage Wi-Fi and provision registered tags through the mobile app. Blitz operators manage tag inventory and user administration through a separate web admin. A NestJS backend is authoritative for identity, permissions, business data, tag registry, and provisioning decisions.

## 2. Users and clients

| User                 | Client                               | Scope                                                                            |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| Business owner       | iOS/Android mobile app               | Set up business and Wi-Fi; provision and inspect assigned tags; present Wi-Fi QR |
| Blitz operator/admin | Web admin (planned; not implemented) | Register inventory, manage users/tags, inspect activity                          |
| Visitor              | Phone camera/NFC; no Blitz account   | Join Wi-Fi using tag or QR where OS supports it                                  |

Admin accounts must not access owner-only mobile flows. Authorization is enforced by the backend, not only by client routing.

## 3. Product goals

- Owner can set up a business, configure Wi-Fi, and provision an eligible tag with clear progress and recovery from network interruption.
- A business may maintain multiple Wi-Fi configurations and select one active configuration.
- Only a registered, non-revoked tag can be provisioned, and a tag cannot be silently reassigned from another business.
- Tag read access stays open; writes are protected when the hardware and provisioning flow support it.
- Visitors can join with NFC on supported Android devices; QR is the fallback, including for iPhone.
- Backend and clients use a reviewed, versioned API contract.

Success measures (targets to define before release): first-tag setup completion/time, first-attempt provisioning success, recovery success after interrupted provisioning, and rejection of unregistered/revoked tags.

## 4. Scope and sequencing

### V1 target

1. **Mobile + backend:** account access, owner/business setup, Wi-Fi management, registered-tag check, safe tag provisioning/reprovisioning, QR display, account deletion.
2. **Admin web:** planned follow-up; inventory/user operations may be performed by an explicitly documented internal process until web admin is ready. Do not imply that web admin is part of the first release.

Email/password is the initial authentication method. Google sign-in is a later phase. Before App Store release, review current platform requirements for third-party sign-in and add any required provider support.

### Out of scope for V1

- Offline data mode or local database/sync engine.
- Visitor analytics based on NFC taps.
- Captive portal, visitor accounts, ads, multiple staff per business, billing/subscriptions.
- Admin screens in the owner mobile app.

## 5. Functional requirements

### Owner mobile app

- Sign up/sign in with email and password; support session restoration and sign-out.
- Set up a business profile; profile photo is optional and may be deferred.
- Set a business PIN and configure at least one Wi-Fi network.
- Add/edit/delete Wi-Fi networks and switch the active network.
- Read tag UID and originality data using supported NFC hardware; call backend before changing a tag.
- Write and verify the approved Wi-Fi payload; report success only after tag readback and backend confirmation.
- Recover/retry confirmation after connectivity loss without accidentally assigning the tag elsewhere.
- Display a Wi-Fi QR payload with correct escaping.
- Allow PIN changes and account deletion according to backend rules; delete/release related data safely.

### Backend

- Authenticate clients and enforce owner/admin permissions for each protected operation.
- Own business/Wi-Fi/tag records and protect credentials and PIN material at rest.
- Register and revoke tag UIDs through an authorized admin workflow or documented interim process.
- Decide provisioning eligibility and ownership server-side.
- Derive tag write credentials server-side from approved key material and business secret inputs; never expose the server secret or PIN to visitors or clients beyond the PIN submission necessary for setup.
- Record auditable tag lifecycle outcomes without logging secrets.
- Expose only reviewed endpoints defined in the versioned OpenAPI contract.

### Admin web (follow-up phase)

- Admin sign-in; reject non-admin users.
- Register tag UIDs individually or in batches (CSV and USB keyboard-emulation reader are proposed methods).
- Find, revoke, release, and inspect tags and users; view event history and summary counts.
- Browser does not execute raw NFC provisioning commands.

## 6. Tag provisioning behavior

1. Owner selects active Wi-Fi and scans a tag.
2. Mobile reads UID and available originality signature, then asks backend for an eligibility decision.
3. Backend checks registration, revocation, and business ownership. It decides whether provisioning/reprovisioning is permitted.
4. Backend returns only the approved operation data needed by the authorized owner client.
5. Mobile performs hardware writes, reads back and compares payload, then confirms completion with backend.
6. If the tag write succeeds but confirmation fails, mobile must show a recoverable pending state and retry idempotently; it must not claim server confirmation prematurely.

### NXP signature policy — V1 decision

For V1, registry status and ownership are the provisioning gate. NXP originality signatures may be recorded and monitored, but an invalid or unavailable signature alone does not block provisioning. This does not prove the IC is genuine or prevent cloning attacks; disclose this limitation. Revisit enforcement only through a new decision record.

## 7. Security and data principles

- All app data requires connectivity; without it, show an explicit error and retry path. Do not add a local DB or offline cache for business data.
- Send credentials/PIN over HTTPS only. The backend stores sensitive values using an explicitly reviewed cryptographic design and does not return the PIN.
- Never log passwords, PINs, session cookies, tag lock secrets, or database connection strings.
- Use server-side validation, authorization, rate limiting for sensitive routes, and auditable changes.
- Define object ownership checks to prevent cross-business IDOR/access.
- Apply least privilege to database/service credentials. Row-level security is a design option to assess, not yet a blanket implementation requirement; document the selected DB access model and test isolation.
- Document threat model, key rotation/recovery, and consequences of account compromise before release.

## 8. Product decisions

| Decision                                  | Status                  | Current direction                                                                                                                                   |
| ----------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Centralized service                       | Decided                 | NestJS backend; clients consume its API                                                                                                             |
| Product repo layout                       | Decided                 | Separate Git repos in `blitz/mobile/`, `blitz/be-blitz/`; admin web planned in `blitz/web-admin/`                                                   |
| Database                                  | Direction               | PostgreSQL; Drizzle proposed; remote schema not yet migrated                                                                                        |
| Supabase role                             | Open                    | Supabase Auth/Data API are not product auth/API. Decide whether Supabase remains the managed PostgreSQL host before provisioning backend DB access. |
| Authentication                            | Decided for first phase | Better Auth, email/password first; Google later                                                                                                     |
| PIN submission                            | Decided                 | Sent once to backend over HTTPS for setup/use; server does not return it                                                                            |
| Tag registration                          | Decided                 | UID must be registered before sale; admin methods proposed: CSV and USB keyboard-emulation reader                                                   |
| NXP originality enforcement               | Decided for V1          | Registry, revocation, and ownership gate provisioning; signature alone does not block                                                               |
| V1 release scope                          | Decided                 | Mobile + backend first; admin web follows; interim inventory process must be documented                                                             |
| API transport/session details             | Open                    | Settle Better Auth cookie/session behavior for native and web clients in OpenAPI/design record                                                      |
| Storage/photo provider and email delivery | Open                    | Choose before implementing dependent features                                                                                                       |

## 9. Release gates

Do not call V1 production-ready until all applicable gates pass:

- Product decisions marked blockers above are resolved; NXP signature enforcement is not a V1 blocker under the selected registry-only policy.
- OpenAPI is reviewed, implemented, and used by clients; generated/derived types do not drift.
- Authentication, owner/admin authorization, cross-business access tests, and account deletion are verified.
- Database migrations are reviewed and tested in a non-production environment; backup/rollback is known.
- Provisioning passes interruption, duplicate/retry, wrong-owner, revoked/unregistered, and physical-device checks.
- NFC/iOS/Android support matrix and any NXP verification policy are accurately represented to users.
- Secrets, email delivery, production TLS, rate limits, monitoring, backups, and operational admin workflow are configured.

## 10. Related documents

- `docs/decisions/` — accepted architecture decisions and unresolved blockers.
- `docs/migrations/SUPABASE-TO-NESTJS.md` — safe client/schema migration checklist; no remote changes performed.
- `docs/AI-ORCHESTRATION.md` — AI workflow only; not a product or API specification.
- `be-blitz/docs/BACKEND-REQUIREMENTS.md` — backend implementation requirements, subordinate to this document.
- `mobile/docs/PRD.md` — legacy, non-authoritative mobile/NFC migration source; use only after validating details against this PRD and hardware evidence.
- `be-blitz/docs/openapi.yaml` — authoritative API contract once created and approved.
