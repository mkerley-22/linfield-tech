# Update DATABASE_URL for Transaction Mode

## Current Issue
Your `DATABASE_URL` is using `pgbouncer=true` which is **session mode** (only 15 connections).

## Solution
Update your `DATABASE_URL` in Vercel to use `pgbouncer=transaction` instead.

## Steps

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Find `DATABASE_URL`**
   - Click the eye icon to reveal the value
   - Copy the current value

3. **Update the URL**
   - Change `pgbouncer=true` to `pgbouncer=transaction`
   - Your new URL should look like:
   ```
   postgres://postgres.frvuzrrnsdxgyzrvxjlg:K8KqJdehMdrxGbWh@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=transaction&connection_limit=10&pool_timeout=20
   ```

4. **Save the changes**
   - Paste the updated URL
   - Make sure it's set for **Production**, **Preview**, and **Development**
   - Click **Save**

5. **Redeploy**
   - The code will also automatically convert `pgbouncer=true` to `transaction` mode
   - But updating the env var directly ensures it's correct from the start

## Why Transaction Mode?

- **Session Mode** (`pgbouncer=true`): Only 15 concurrent connections
- **Transaction Mode** (`pgbouncer=transaction`): Up to 200 concurrent connections

Transaction mode is perfect for serverless functions because:
- Each function only needs a connection for the duration of a transaction
- Connections are released immediately after the query completes
- Much higher concurrency without connection pool exhaustion

## Note
The code in `lib/prisma.ts` will automatically convert `pgbouncer=true` to `transaction` mode, but updating the environment variable directly is the cleanest solution.

