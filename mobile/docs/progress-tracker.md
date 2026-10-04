# Implementation status

Status snapshot: 2026-10-03. Product requirements remain in [`PRD.md`](./PRD.md).

## Current phase

Android-first prototype and physical NFC read testing. Authentication, Supabase integration, and real provisioning are not complete.

## Implemented in the current working tree

- Expo Router onboarding screens for business name, PIN, and first Wi-Fi configuration.
- Prototype profile/Wi-Fi data stored locally with Expo SecureStore.
- Home, Wi-Fi selection, Wi-Fi QR preview, and provisioning test screens.
- Android development build installed locally on the connected Infinix X6880.
- Raw NTAG215 helper functions exist for UID/signature/NDEF/password operations; their end-to-end correctness and genuine-tag tests are not established.
- NFC manager Android wrapper is locally patched via `scripts/patch-nfc-manager.js` to forward request options to the native method; keep this patch and native module in sync.

## Verified

- `npx tsc --noEmit` passed after the current NFC detail-screen changes.
- Android JS bundle export passed.
- Local native Gradle build required `JAVA_TOOL_OPTIONS=--enable-native-access=ALL-UNNAMED`, completed, and installed the debug APK after uninstalling the EAS-signed app. The locally installed app uses a different signing key from EAS builds.
- UID read was observed working by the user; UID reported: `04839E6C410289`.

## Not yet verified / next

- Read and cryptographically verify NXP originality signature on a known genuine NTAG215.
- Correct complete NFC reads: signature, tag metadata, and actual user memory; current UI must not claim data that the installed library does not expose.
- Safe real write/provision/lock flow is not implemented end-to-end and remains disabled.
- Add app-generated Blitz marker only after choosing server-signed format and ensuring NDEF Wi-Fi record compatibility.
- Better Auth, RLS, Supabase integration, and admin web registration are not active.

## Open product/security decision

Whether v1 continues requiring genuine NXP NTAG215 originality verification (as specified by the PRD), or accepts third-party tags carrying a server-signed Blitz marker. A marker can authenticate issued data but is copyable on NTAG215 and does not prove physical chip authenticity. Do not silently replace the PRD requirement.
