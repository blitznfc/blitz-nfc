# Architecture decision: NXP originality signature enforcement in V1

- Status: **Accepted for V1**
- Date recorded: 2026-10-04
- Affected docs: `docs/PRD.md`, `be-blitz/docs/BACKEND-REQUIREMENTS.md`, `mobile/AGENTS.md`, backend provisioning design/API contract

## Question

Does V1 reject tag provisioning when the NTAG215 NXP originality signature is invalid or unavailable?

## Options

1. **Require valid NXP signature.** Reject invalid/unavailable signature. This helps reject some counterfeit chips but does not prevent cloned UID+signature attacks; test authentic inventory and reliable reads on supported iOS/Android hardware.
2. **Registry-only decision for V1.** Backend requires registered, non-revoked UID and ownership checks; signature may be recorded/monitored but does not block provisioning. Clearly disclose weaker counterfeit detection.

## Decision

Select registry-only enforcement for V1: registered, non-revoked UID and business ownership checks control provisioning. Signature may be recorded/monitored, but invalid or unavailable signature alone does not block provisioning. This does not establish that the IC is genuine and does not stop UID+signature clones.

## Evidence and follow-up

- Verify actual production tag batch signatures against NXP public key on supported devices.
- Measure signature read/verification failure rates separately from invalid signatures.
- Assess counterfeit/cloning threat and operational cost of false rejection.
- Define admin recovery and tag replacement if a future release requires signature enforcement.
- Reopen this decision only with threat evidence and measured legitimate-tag false-rejection/read-failure rates.
