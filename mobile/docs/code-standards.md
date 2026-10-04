# Coding conventions

Project-specific hard constraints are in the root [`AGENTS.md`](../AGENTS.md). This document records only short conventions for the current Expo/React Native codebase; `AGENTS.md` takes precedence if there is a conflict.

- Use TypeScript strict mode, narrow types, and handle expected failures explicitly.
- Use Expo Router for navigation; route files belong in `src/app/`, reusable modules outside it.
- Follow the root Ponytail rule: prefer existing Expo/native capabilities and installed dependencies; avoid speculative abstractions.
- Mobile screens should use platform-appropriate controls, accessibility labels, safe-area handling, and responsive layouts.
- Use the app theme in `src/constants/theme.ts` where it applies; avoid introducing unrelated styling systems.
- Keep raw NFC/session code in `src/lib/ntag215.ts`. Always ensure NFC session cleanup on success, failure, cancellation, and navigation away.
- Do not call a value encrypted unless it is actually encrypted. Base64 and hashes are not encryption.
- Do not activate direct Supabase data access until authentication and owner-scoped RLS are designed and tested.

## Verification

- `npx tsc --noEmit`
- `npx expo lint` (currently has a pre-existing web color-scheme hook error; record whether it is resolved before claiming lint passes)
- `npx expo export --platform android --output-dir /tmp/blitz-export-check`
- Physical NFC behavior requires a development build/native binary; JS export alone does not validate hardware behavior.
