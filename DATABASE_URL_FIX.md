# Fix DATABASE_URL for Prisma Compatibility

## The Problem
Prisma is rejecting the connection string because it contains parameters it doesn't recognize.

## The Solution
Use a clean connection string with **port 6543** (transaction mode) and **no query parameters**.

## Your DATABASE_URL Should Be:

```
postgres://postgres.frvuzrrnsdxgyzrvxjlg:K8KqJdehMdrxGbWh@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

**Key changes:**
1. Port changed from `5432` to `6543` (transaction mode = 200 connections)
2. **Remove ALL query parameters** (`?sslmode=require&pgbouncer=true&connection_limit=10&pool_timeout=20`)
3. Keep only: `postgres://user:password@host:port/database`

## Why Port 6543?

- **Port 5432** = Session mode (only 15 connections) → causes "max clients reached"
- **Port 6543** = Transaction mode (200 connections) → prevents the error

## Steps to Update in Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. Replace the entire value with:
   ```
   postgres://postgres.frvuzrrnsdxgyzrvxjlg:K8KqJdehMdrxGbWh@aws-1-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. Make sure it's set for **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your application

## Why Remove Query Parameters?

Prisma's connection string validator is strict and rejects parameters it doesn't recognize. The `pgbouncer`, `connection_limit`, `pool_timeout`, etc. parameters are not standard PostgreSQL connection string parameters that Prisma accepts.

## SSL

Don't worry about `sslmode=require` - Supabase requires SSL by default, and Prisma will handle it automatically when connecting to port 6543.

## Verification

After updating, check your Vercel logs. You should see:
- "Switched Supabase pooler to port 6543 (transaction mode - 200 connections)"
- "Cleaned connection string (removed query parameters)"
- "Final database URL: postgres://postgres.frvuzrrnsdxgyzrvxjlg:****@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

