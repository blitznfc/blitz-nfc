# Engineering Decisions

## Prisma and MCP

- Backend ORM: Prisma ORM 7.10.0, latest stable release observed during setup (Prisma 8 is still release-candidate tagged).
- PostgreSQL driver: `@prisma/adapter-pg` with `pg`; construct one PrismaClient service in NestJS.
- Prisma MCP: VS Code workspace MCP at `https://mcp.prisma.io/mcp` is a development-time tool only. Do not treat it as runtime DB access.
- No Prisma models, introspection, database connection, migration, or data write was performed during bootstrap. Supabase may remain the PostgreSQL host; project access/data backup must be verified first.
- Supabase client is removed from mobile; legacy schema and migration assets are preserved until verified migration is planned.
