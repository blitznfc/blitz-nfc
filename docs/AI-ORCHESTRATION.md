# Blitz AI Development Orchestration

Status: **Working agreement** · Applies to `mobile/`, `be-blitz/`, and future `web-admin/`.

## Aim

Keep product behavior, API contracts, security boundaries, and release checks aligned across independent repositories. This document describes a lightweight agent workflow, not an autonomous multi-agent runtime. Agents/subagents are used only when the current coding host exposes them.

## Ownership

| Concern                                                       | Owner                                                                                  |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Product behavior and acceptance criteria                      | `docs/PRD.md` (single shared source of truth)                                          |
| HTTP API contract and compatibility                           | `be-blitz/docs/openapi.yaml` (not present; create/review before client implementation) |
| Auth, permissions, business rules, DB and server cryptography | `be-blitz/`                                                                            |
| NFC and device UX                                             | `mobile/`                                                                              |
| Admin workflows and UI                                        | `web-admin/`, through backend API                                                      |
| Cross-project sequencing and requirement conflicts            | Primary agent, guided by root `AGENTS.md`                                              |

## Roles / sequence

1. **Coordinator (primary agent):** determine scope, read project docs, select mode, keep changes within repo ownership, and report unresolved blockers.
2. **Investigator (optional subagent):** read-only locate code, tests, dependency/call paths, and report file/line evidence. Use `cavecrew-investigator` for terse mapping.
3. **Builder (primary agent or bounded subagent):** make the smallest change allowed by requirements. `cavecrew-builder` is only for known, clear changes in 1–2 existing files.
4. **Skeptic (always performed by AI):** independently challenge assumptions, contract drift, security, failure paths, migration risk, and unnecessary complexity. This is not a user questionnaire. Raise a user question only for an unresolved product decision that blocks a safe implementation.
5. **Verifier/reviewer:** run project checks and review the diff. Use `cavecrew-reviewer` for bounded bug-oriented review; primary agent handles broader architecture review.

These roles are workflow passes, not a promise that separate agents ran. State when a pass was self-reviewed versus delegated.

## Complexity/mode selection

| Complexity / request                                            | Workflow                                                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Trivial / one obvious change                                    | Normal mode, direct edit, targeted check                                                                          |
| Read-only code lookup                                           | `cavecrew-investigator` if subagents available                                                                    |
| Bounded 1–2-file edit                                           | `cavecrew-builder` only when context is complete and scope obvious                                                |
| 3+ files, new feature, multi-repo, API/schema/auth/NFC/security | Main agent plan → investigator if useful → changes by ownership → skeptic pass → tests → reviewer                 |
| Large uncertain feature or product trade-off                    | First present agent's analysis/options; ask only for a decision that cannot be resolved from PRD or safe defaults |
| Explicit `/caveman`                                             | Use `caveman` voice persistently until `stop caveman` / `normal mode`                                             |
| Explicit `/ultracave` or `/megacave`                            | Use matching mode; revert to plain language wherever ambiguity/security makes compression unsafe                  |
| Explicit memory compression/stats request                       | Invoke `caveman-compress`/`caveman-stats` with their constraints; never infer savings                             |

Default: normal mode. Complexity does not automatically activate terse voice. Compression may shorten status output, never requirements, identifiers, safety reasoning, or verification.

MCP servers/tools, when configured, are development-time tools only. They are not part of the Blitz app's production runtime unless the Product PRD explicitly changes that decision.

## Cross-project workflow

For non-trivial work crossing projects:

1. Read root and affected project rules, shared PRD, relevant source, and Git status.
2. State acceptance criteria. The AI performs skeptic review itself; ask user only when a product decision is genuinely blocked.
3. Agree on API/data ownership before parallel or dependent implementation. Once approved, OpenAPI is the HTTP contract.
4. Backend first for domain decisions/data/auth; then update each client. Do not couple repository dependencies or Git history.
5. Test behavior/failure paths, then lint/typecheck/build each affected project. Physical NFC changes require device checks.
6. Review diffs and report what is verified, proposed, or still blocked.

### Stop and ask user only if

- PRD contains conflicting product outcomes and no safe interpretation is evident.
- Choice changes platform, auth method, data retention, security posture, or destructive behavior.
- Remote migration/deployment/commit/push was not explicitly authorized.

Otherwise, state assumptions and proceed with the least risky documented option.

## Security and reliability review checklist

- Is authorization checked on the server for every protected object/action?
- Can one business owner access another owner's records by changing an ID?
- Are secrets, PINs, Wi-Fi credentials, lock passwords, and tokens kept out of logs/client bundles?
- Are writes validated, rate-limited where sensitive, and safe under retries/duplicates?
- Are provisioning's approve → physical write → verify → confirm states recoverable after app/network interruption?
- Are transaction boundaries and unique/FK constraints correct for database invariants?
- Are authentication cookies/session requests supported by both Expo and web clients over production origins?
- Do failure responses expose only safe details and preserve a stable API contract?

## Verification commands (confirm per project first)

- Backend: `cd be-blitz && npm run lint && npm test && npm run build`
- Mobile: `cd mobile && npx expo lint && npx tsc --noEmit`
- Web: inspect `web-admin/` scripts and instructions before selecting checks.

Do not report a check as passing unless it was executed and exited successfully. No remote DB changes or deployment without explicit user request.
