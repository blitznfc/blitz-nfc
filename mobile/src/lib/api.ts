/**
 * Supabase direct database access is retired from the mobile app.
 *
 * Keep this compatibility module only until its callers are migrated. Do not
 * reconnect it to Supabase; replace callers with the NestJS API client once the
 * corresponding OpenAPI operation is approved and implemented.
 */
export function supabaseDirectAccessRemoved(): never {
  throw new Error(
    "Direct Supabase access is disabled. Use the approved Blitz backend API.",
  );
}
