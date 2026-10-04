# UI context

The current screens use a light, native mobile visual direction with muted warm backgrounds and green as the Blitz action/accent color. Reusable theme values currently live in `src/constants/theme.ts`; the recent prototype screens still contain local style values and should be consolidated into theme tokens during a deliberate design-system pass.

- Prioritize Android touch targets, safe areas, readable contrast, keyboard behavior, and accessible labels.
- Prefer native controls and platform conventions; avoid web-style dashboard patterns on mobile.
- Use the shared Expo/React Native components and theme already in the app; no web CSS-token or component-library assumptions apply here.
- NFC scan UI must clearly distinguish waiting, successful UID read, unsupported/disabled NFC, scan failure, and user cancellation.
- The tag details screen must label estimates and unavailable Android fields honestly; never fabricate ATQA, SAK, capacity, or chip authenticity.
