/**
 * Supabase client retired from the mobile app. Do not restore client-side
 * database/API access; mobile data requests belong on the NestJS backend.
 * Keep this module temporarily so stale imports fail closed with a clear error.
 */
export function supabaseClientRemoved(): never {
  throw new Error(
    "Supabase client access is disabled in mobile. Use the approved Blitz backend API.",
  );
}
