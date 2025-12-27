# Setting Up Database on Vercel

## Quick Fix for "DATABASE_URL not found" Error

### Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Click on **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose **"Hobby"** plan (free tier)
6. Click **"Create"**

Vercel will automatically create these environment variables:
- `POSTGRES_URL` - **Pooled connection URL** (use this for your app - handles connection pooling)
- `POSTGRES_PRISMA_URL` - For Prisma migrations (includes connection pooling)
- `POSTGRES_URL_NON_POOLING` - Direct connection (DO NOT use for app - causes max clients error)

### Step 2: Add DATABASE_URL Environment Variable

**IMPORTANT:** Use the **pooled** connection URL to avoid "max clients reached" errors.

1. Go to **Settings** → **Environment Variables**
2. You should see `POSTGRES_URL` already there (added by Vercel)
3. Click the **eye icon** next to `POSTGRES_URL` to reveal the value
4. **Copy the entire value** (this is the pooled connection URL)
5. Click **"Add New"** to create a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste the value you copied from `POSTGRES_URL` (the pooled URL)
   - **Environment**: Select **Production**, **Preview**, and **Development**
6. Click **"Save"**

**⚠️ Critical:** Make sure you're using `POSTGRES_URL` (pooled), NOT `POSTGRES_URL_NON_POOLING`. Using the non-pooling URL will cause "MaxClientsInSessionMode" errors.

### Step 3: Run Database Migrations

After setting `DATABASE_URL`, you need to create the database tables. You have two options:

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```
   - Select your project
   - Select your scope

4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

#### Option B: Using Prisma Studio (Alternative)

1. Pull environment variables locally:
   ```bash
   vercel env pull .env.local
   ```

2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

   Or push the schema directly:
   ```bash
   npx prisma db push
   ```

### Step 4: Redeploy Your App

1. Go to **Deployments** tab in Vercel
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

Or push a new commit to trigger a new deployment.

### Step 5: Verify It Works

1. Visit your Vercel URL
2. Try logging in
3. The database error should be gone!

## Troubleshooting

### "Still getting DATABASE_URL error"

- Make sure `DATABASE_URL` is set for **all environments** (Production, Preview, Development)
- Redeploy after adding the variable
- Check that the value matches `POSTGRES_URL` exactly

### "Migration failed"

- Make sure you're using `POSTGRES_PRISMA_URL` for migrations (not `POSTGRES_URL`)
- Or use `DATABASE_URL` if you set it to the Prisma URL
- Check Vercel logs for specific error messages

### "Can't connect to database"

- Verify the database is active in the Storage tab
- Check that `DATABASE_URL` value is correct
- Make sure SSL is enabled (Vercel Postgres requires it)

## Quick Checklist

- [ ] Created Vercel Postgres database
- [ ] Added `DATABASE_URL` environment variable (copied from `POSTGRES_URL`)
- [ ] Set for Production, Preview, and Development
- [ ] Ran database migrations (`npx prisma migrate deploy`)
- [ ] Redeployed the app
- [ ] Tested login - no more database errors!

