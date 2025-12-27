# Fix "Prepared Statement Already Exists" Error

## The Problem
Prisma uses prepared statements for performance, but Supabase's PgBouncer (connection pooler) doesn't support prepared statements properly. This causes errors like:
- `prepared statement "s0" already exists`
- `prepared statement "s2" already exists`

## The Solution
**Use the DIRECT connection URL instead of the pooler URL** for Prisma.

## Your DATABASE_URL Should Be:

### Direct Connection (for Prisma):
```
postgres://postgres.frvuzrrnsdxgyzrvxjlg:K8KqJdehMdrxGbWh@aws-1-us-east-1.db.supabase.co:5432/postgres
```

**Key changes:**
1. `pooler.supabase.com` → `db.supabase.co` (direct connection)
2. Port `5432` (direct connection, not 6543)
3. **No query parameters**

## Why Direct Connection?

- **Pooler URL** (`pooler.supabase.com`): Uses PgBouncer which doesn't support prepared statements
- **Direct URL** (`db.supabase.co`): Direct PostgreSQL connection that supports prepared statements

## Steps to Update in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. Replace the entire value with:
   ```
   postgres://postgres.frvuzrrnsdxgyzrvxjlg:K8KqJdehMdrxGbWh@aws-1-us-east-1.db.supabase.co:5432/postgres
   ```
5. Make sure it's set for **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your application

## Important Notes:

- **Direct connections have a limit** (typically 60-100 connections for Supabase)
- For high-traffic apps, you may need to:
  - Use connection pooling at the application level
  - Optimize queries to reduce connection time
  - Consider upgrading your Supabase plan

## Alternative: Get Direct Connection URL from Supabase

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Database**
2. Look for **Connection string** or **Direct connection**
3. Copy the connection string (should be `db.supabase.co`, not `pooler.supabase.com`)
4. Use that as your `DATABASE_URL` in Vercel

## Verification

After updating, check your Vercel logs. You should see:
- "Converted Supabase pooler URL to direct connection URL (required for Prisma prepared statements)"
- "Using database URL: postgres://postgres.frvuzrrnsdxgyzrvxjlg:****@aws-1-us-east-1.db.supabase.co:5432/postgres"

The code will automatically convert pooler URLs to direct URLs, but updating the environment variable directly is cleaner.

