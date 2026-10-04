This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

Product: **Blitz** — NFC WiFi connector. Read `../docs/PRD.md` before implementing product behavior. If a request conflicts, report it; do not silently choose.

⚠️ **ARCHITECTURE UPDATE: Centralized Backend**

Blitz now uses a **centralized NestJS backend** (`../be-blitz/`). This mobile app is a **thin client** — it must NOT contain business logic or database operations.

| Domain                   | Responsibility                                             |
| ------------------------ | ---------------------------------------------------------- |
| **Mobile (this)**        | UI, NFC hardware, API consumer, offline state              |
| **Backend (`be-blitz`)** | Auth, business logic, NFC provisioning API, DB persistence |

**Mobile MUST:**

- Call backend API endpoints only
- Handle NFC hardware via `react-native-nfc-manager`
- Show clear error states when offline

**Mobile MUST NOT:**

- Touch database directly (no `supabase-js` calls)
- Derive tag passwords (server-only `HMAC-SHA256`)
- Verify NXP signatures (server-only)
- Contain business logic

For workspace-wide decisions and agent modes, read `../AGENTS.md` and `../docs/AI-ORCHESTRATION.md`. Check `../be-blitz/AGENTS.md` and `../be-blitz/docs/BACKEND-REQUIREMENTS.md` for backend boundaries. Treat API examples as proposals until reviewed OpenAPI exists.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Coding style: Ponytail (lazy senior dev)

The `ponytail` plugin is the default mode for every coding task — apply it without being asked. If the plugin is not active, follow its rules anyway: before writing code, stop at the first option that works — not needed at all → already in this codebase → JS/TS built-ins → native platform feature or installed Expo module (`@expo/ui`, `expo-symbols`, `expo-image`, …) → already-installed dependency → one line → only then the minimum new code. No unrequested abstractions, boilerplate, or files. Mark deliberate shortcuts with a `ponytail:` comment naming the limit and upgrade path.

Before coding: if the request is ambiguous, state your assumption in one line (ask only if a wrong guess would be costly). For non-trivial work, define how you'll verify it (check, test, or on-device behavior) and confirm it before declaring done.

Pick the matching skill yourself — the user will not name it:

| Situation                                                                  | Use                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Writing, fixing, or refactoring code                                       | `ponytail` (always on)                                              |
| User asks to review, simplify, or "is this too complex?" on recent changes | `ponytail-review` for over-engineering, plus `code-review` for bugs |
| User asks to clean up or find bloat across the whole app                   | `ponytail-audit`                                                    |
| Before a release, or user asks what was deferred / what shortcuts exist    | `ponytail-debt`                                                     |
| User asks what ponytail saves / how to use it                              | `ponytail-gain` / `ponytail-help` — never otherwise                 |

Lazy never overrides the rules above or these:

- Still fetch the versioned Expo docs before touching an Expo/RN API.
- NFC needs a third-party native library (e.g. `react-native-nfc-manager` via its config plugin) and a development build — adding it is required, not over-engineering.
- Not lazy about NFC hardware reality: tag read failures, timeouts, session cancel, NFC disabled/unsupported, and iOS vs Android differences.
- Not lazy about input validation, error handling that prevents data loss, security, or accessibility.

## UI design: native, not AI slop

Screens must look like a native iOS/Android app, not a generated web page. Pick the skill yourself:

| Situation                                                                       | Use                                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Building or changing any screen or component                                    | `expo-ui` first (native SwiftUI/Compose components), then `expo-native-ui` for layout, semantic colors, SF Symbols, effects  |
| Colors, spacing, typography, reusable components, theme                         | `expo-design-system` — all values come from the theme, no hardcoded colors/fonts in screens                                  |
| Motion, gestures, sheets, press feedback, haptics                               | `expo-animation`                                                                                                             |
| User says it looks bland, generic, AI-made, or asks to critique/polish/redesign | `impeccable` (critique, polish, bolder, quieter — use its iOS/Android references), plus `expo-design-system` audit for drift |

Before finishing any UI work, check it against `expo-design-system`'s native-slop tells (Everything's a Card, purple-gradient hero, emoji as icons, `Alert.alert` confirmations, floating pill tab bar, hand-rolled header, `Touchable*` instead of `Pressable`, Inter everywhere).

When skills disagree: Expo skills win on platform specifics; Ponytail still applies — prefer a native component over a custom-built one, but visual polish the user asked for is not over-engineering.

## Auth & data (decided — do not swap without asking)

- **Auth target:** Better Auth, email/password first; Google later. Better Auth server belongs in NestJS, not Expo API routes. Mobile auth client uses secure session storage and calls the reviewed backend contract. Current mobile auth/dependencies are migration leftovers, not final architecture.
- **Fully online — no offline mode.** No on-device DB, no sync engine. Screens call the API directly; when there is no connection (`expo-network`), show a clear state with retry instead of caching data.
- **DB:** PostgreSQL + Drizzle in NestJS only. Never access DB directly from mobile; never add `expo-sqlite` or local persistence for app data.
- **Roles:** the mobile app is for business owners only — no admin screens, and `admin` accounts are refused there. Admin is web-only.
- **Tags:** admin registers UIDs before sale. Backend checks registry, revocation, and ownership. For V1, invalid/unavailable NXP signature alone does not block provisioning; see `../docs/decisions/ADR-0001-nxp-signature-v1.md`. Mobile writes only after backend approval, verifies readback, and confirms. PIN setup sends the PIN once to the backend over HTTPS; the server does not return it. Reads remain unlocked.

## NFC (see `../docs/PRD.md`)

- Library: `react-native-nfc-manager@4.0.0-beta.9` pinned exactly (v3 is legacy-arch only). Config plugin with `includeNdefEntitlement: false` (TAG only — NDEF entitlement is rejected by App Store).
- Talk to NTAG215 with raw commands only (Android `nfcAHandler.transceive`, iOS `sendMifareCommandIOS`), wrapped in one module; write NDEF page-by-page after `PWD_AUTH` in the same session. Call `getTag()` only inside an active `requestTechnology` session (iOS crash #833).
- Tag password = `HMAC-SHA256(SERVER_SECRET, PIN ‖ UID)` truncated to PWD(4)+PACK(2), server-side. `AUTHLIM = 0`, `PROT = 0` (write-lock only).
- V1 provisioning uses backend registry, revocation, and ownership checks. An invalid or unavailable NXP originality signature alone does not block provisioning; see `../docs/decisions/ADR-0001-nxp-signature-v1.md`.

## Agent workflow

Follow `../docs/AI-ORCHESTRATION.md`; this file defines only project-specific constraints.
