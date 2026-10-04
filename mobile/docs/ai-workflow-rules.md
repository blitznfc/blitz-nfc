# AI workflow notes

Use the root [`AGENTS.md`](../AGENTS.md) for mandatory coding, Expo documentation, architecture, security, and verification instructions. This file supplements those instructions only where this prototype needs explicit product-safety notes.

- Read [`PRD.md`](./PRD.md) before product behavior changes; if prototype shortcuts conflict with it, keep them clearly marked as temporary and do not treat them as production behavior.
- Make small changes and validate with TypeScript, lint, Android bundle export, and—when NFC/native behavior changes—a development build plus physical-device test.
- Report what was verified versus what remains untested. Do not infer successful NFC reads or signature validation from UI state alone.
- Never write/lock real tags or send credentials to Supabase until server approval, authentication, ownership checks, and RLS are ready.
- Record a lasting architecture/product decision in `architecture.md` or `PRD.md`, not in a generic session journal.
