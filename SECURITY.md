# Security & SOC2

This document summarizes security measures relevant to the application and Supabase, including Row Level Security (RLS) and handling of sensitive data.

## Row Level Security (RLS)

- **All tables** in the `public` schema should have RLS **enabled** (see `prisma/migrations/enable_rls_all_tables.sql` and `prisma/migrations/README_RLS.md`).
- With RLS enabled and **no** policies for the `anon` role, the Supabase Data API (PostgREST) allows **no** access to those tables when using the anon key. This satisfies Supabase’s “RLS Disabled in Public” and “Sensitive Columns Exposed” linter checks.
- The application uses **Prisma** with a single database connection (`DATABASE_URL`). In Supabase, that connection uses a role (e.g. `postgres`) that **bypasses RLS**. So:
  - All server-side access (Next.js API routes, server components) continues to work without change.
  - RLS only applies to connections that do **not** bypass RLS (e.g. Supabase client using the anon key). With no policies for anon, such connections get no data.

## Sensitive data

- **Session tokens** (`Session.token`): Stored only in the database; never exposed to the client. RLS ensures that, if the Supabase API is used with the anon key, `Session` (and thus `token`) are not readable.
- **User PII** (e.g. `User.email`, `User.name`): Accessed only via authenticated API routes; not exposed through public endpoints.
- **Checkout / request data**: Public endpoints allow only the minimal actions intended (e.g. creating a checkout request). No bulk read of checkout or user data is exposed publicly.

## Application access control

- Authentication is handled in the app (e.g. session-based), not via Supabase Auth.
- Admin-only actions are gated by server-side checks (e.g. `getUser()`, role checks) before performing privileged operations.
- Public endpoints (e.g. public inventory catalog, checkout request submission) are read-only or insert-only as designed; no update/delete of other users’ data is allowed.

## Running the RLS migration

1. Apply the SQL in `prisma/migrations/enable_rls_all_tables.sql` in the Supabase SQL Editor (see `prisma/migrations/README_RLS.md` for table naming and steps).
2. Re-run the Security Advisor in the Supabase dashboard to confirm RLS (and sensitive-column) issues are resolved.
3. No application code or environment variable changes are required for the migration.

## SOC2-relevant points

- **Access control:** RLS enforces that API access (anon key) has no default access to tables; application access uses a dedicated role that bypasses RLS only for backend use.
- **Least privilege:** Public and anon access are minimized; sensitive tables (e.g. `Session`, `User`) have no anon policies.
- **Data protection:** Sensitive columns (e.g. `Session.token`) are not exposed via the Supabase API when RLS is enabled and policies are restrictive.
- **Change management:** Schema and RLS changes are tracked in version control (e.g. Prisma schema and migration SQL).

For operational and compliance details (e.g. logging, incident response, vendor reviews), extend this document or maintain a separate security/compliance runbook.
