# Architecture context

Product behavior and intended production design are specified in [`PRD.md`](./PRD.md). This file describes only the current repository implementation and distinguishes prototype behavior from planned architecture.

## Current stack

| Layer                   | Technology                                 | Current use                                                    |
| ----------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| App/runtime             | Expo SDK 57, React Native 0.86, TypeScript | Mobile app; Android is the current test target                 |
| Routing                 | Expo Router                                | File-based screens in `src/app/`                               |
| NFC                     | `react-native-nfc-manager@4.0.0-beta.9`    | Android reader mode, UID and raw NTAG215 command experiments   |
| Local prototype storage | `expo-secure-store`                        | Stores local onboarding profile, PIN, and Wi-Fi data on device |
| QR                      | `react-native-qrcode-svg`                  | Renders the local Wi-Fi QR preview                             |
| Remote API              | Not connected in the prototype             | Supabase tables/API are not used by the local screens          |

## Boundaries

- `src/app/` contains Expo Router routes and screens.
- `src/lib/ntag215.ts` contains the raw NFC helper layer; UI screens should call it rather than scatter tag commands.
- `src/lib/prototype.ts` owns local SecureStore prototype data and QR payload generation.
- `src/lib/api.ts` and `src/lib/supabase.ts` are legacy/inactive groundwork; do not treat them as an active secure backend.
- `docs/PRD.md` defines intended product rules, not proof that those flows are implemented.

## Current storage and security state

- The prototype's business name, PIN, and Wi-Fi credentials are stored locally via SecureStore. Keep prototype data non-production and on-device.
- Supabase schema exists remotely, but the app is not currently wired to it. Authentication and usable RLS-backed owner access are not implemented.
- No server-side tag registry check, authenticity verification, or signature issuance is active in the app flow.
- The current NFC screen reads tag information only; it must not write or lock tags until an authenticated server-side approval/provisioning design is implemented.

## Invariants for current work

1. Do not claim NXP authenticity from UID format or tag metadata alone.
2. Treat an originality signature as valid only after verifying the exact READ_SIG bytes against the NXP public key using an audited implementation; an absent/zero/failed signature is not valid.
3. Never put server secrets, tag passwords, or signing private keys in the mobile app.
4. NFC sessions must always be closed/cancelled on success, error, cancellation, or leaving the screen.
5. Keep platform-specific raw NFC operations behind `src/lib/ntag215.ts`; test with physical tags and report Android versus iOS limitations.
