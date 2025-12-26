# Complete Vercel Setup Guide

This guide will walk you through the entire deployment process step-by-step.

## Part 1: Database Migration (SQLite → PostgreSQL)

### Step 1.1: Choose PostgreSQL Provider

**Option A: Vercel Postgres (Recommended)**
- Free tier: 256 MB storage, 60 hours compute/month
- Integrated with Vercel
- Easy setup

**Option B: Supabase (Free Tier)**
- Free tier: 500 MB database, unlimited API requests
- Great for development and small projects
- Sign up at [supabase.com](https://supabase.com)

**Option C: Neon (Free Tier)**
- Free tier: 3 GB storage
- Serverless PostgreSQL
- Sign up at [neon.tech](https://neon.tech)

### Step 1.2: Create PostgreSQL Database

#### If using Vercel Postgres:
1. We'll set this up after creating the Vercel project (see Part 2)

#### If using Supabase:
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
5. It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

#### If using Neon:
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string from the dashboard

### Step 1.3: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 1.4: Migrate Your Data (Optional - if you have existing data)

If you have data in SQLite that you want to migrate:

1. **Export data from SQLite:**
   ```bash
   # Install sqlite3 if needed
   sqlite3 prisma/dev.db ".dump" > backup.sql
   ```

2. **Or use a migration tool:**
   ```bash
   # Install pgloader (macOS)
   brew install pgloader
   
   # Migrate data
   pgloader sqlite://prisma/dev.db postgresql://user:pass@host:5432/dbname
   ```

3. **Or manually export/import:**
   - Use Prisma Studio to export data
   - Import into new PostgreSQL database

## Part 2: Vercel Project Setup

### Step 2.1: Prepare Your Code

1. **Make sure everything is committed:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

### Step 2.2: Create Vercel Account & Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Click **"Add New..."** → **"Project"**
4. **Import Git Repository:**
   - Select your repository
   - Click **"Import"**

### Step 2.3: Configure Build Settings

Vercel should auto-detect Next.js. Verify:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `prisma generate && npm run build` (already set in package.json)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Step 2.4: Add Vercel Postgres (If using Option A)

1. In your Vercel project dashboard, go to **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose **"Hobby"** plan (free)
5. Click **"Create"**
6. Vercel will automatically add `POSTGRES_URL` environment variable
7. You'll also get `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`

**Important:** Use `POSTGRES_PRISMA_URL` for Prisma migrations and `POSTGRES_URL` for your app.

## Part 3: Environment Variables

### Step 3.1: Add Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

#### Required Variables:

```
DATABASE_URL=your_postgres_connection_string
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

**For Vercel Postgres:**
- Use `POSTGRES_PRISMA_URL` for migrations
- Use `POSTGRES_URL` for the app (Vercel adds this automatically)

**For External PostgreSQL:**
- Format: `postgresql://user:password@host:port/database?sslmode=require`

#### Optional Variables (add if using these features):

```
# AI Features
OPENAI_API_KEY=sk-your-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/google/callback

# Google Image Search
GOOGLE_CUSTOM_SEARCH_API_KEY=your-api-key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-engine-id

# Unsplash
UNSPLASH_ACCESS_KEY=your-access-key

# Vercel Blob Storage (for file uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx (get from Vercel Storage)
```

**Important:**
- Add variables for **Production**, **Preview**, and **Development**
- Update `GOOGLE_REDIRECT_URI` to your production URL
- After adding variables, redeploy your app

## Part 4: File Storage Setup

### Option A: Vercel Blob Storage (Recommended)

1. **In Vercel Dashboard:**
   - Go to **"Storage"** tab
   - Click **"Create Database"** → **"Blob"**
   - Choose **"Hobby"** plan (free: 1 GB storage)
   - Click **"Create"**

2. **Get your token:**
   - Go to **"Storage"** → Your Blob store
   - Copy the **"Read and Write Token"**
   - Add as `BLOB_READ_WRITE_TOKEN` environment variable

3. **Install Vercel Blob:**
   ```bash
   npm install @vercel/blob
   ```

4. **The storage abstraction is already created** in `lib/storage.ts`
   - It automatically uses Vercel Blob in production
   - Falls back to local storage in development

### Option B: External Storage (S3, Cloudinary, etc.)

If you prefer external storage, you'll need to:
1. Set up your storage provider
2. Update upload routes to use that provider
3. Update `lib/storage.ts` accordingly

## Part 5: Google OAuth Configuration

### Step 5.1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. **Add Authorized Redirect URIs:**
   - `https://your-app-name.vercel.app/api/auth/google/callback`
   - `https://your-app-name.vercel.app/api/auth/google/calendar/callback`
   - `https://your-app-name.vercel.app/api/auth/login/callback`
6. Click **"Save"**

### Step 5.2: Update Environment Variables

Make sure `GOOGLE_REDIRECT_URI` points to your Vercel URL:
```
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/google/callback
```

## Part 6: Deploy

### Step 6.1: First Deployment

1. **Push your code:**
   ```bash
   git push origin main
   ```

2. **Vercel will automatically deploy**
   - Watch the build logs in Vercel dashboard
   - Check for any errors

### Step 6.2: Run Database Migrations

After first deployment, run migrations:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Vercel Dashboard**
1. Go to your project → **"Deployments"**
2. Click on the latest deployment
3. Go to **"Functions"** tab
4. Or use Vercel's database tools in the Storage tab

### Step 6.3: Verify Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test:
   - [ ] Homepage loads
   - [ ] Can create an account/login
   - [ ] Can create pages
   - [ ] File uploads work
   - [ ] Database queries work

## Part 7: Post-Deployment

### Step 7.1: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Step 7.2: Monitor Your App

1. **Check Analytics:**
   - Go to **"Analytics"** tab
   - Enable if desired

2. **Check Logs:**
   - Go to **"Deployments"** → Click a deployment → **"Functions"**
   - View function logs

3. **Set up Error Tracking:**
   - Consider adding Sentry or similar
   - Monitor for errors

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
- Solution: Build command should include `prisma generate`
- Already fixed in package.json

**Error: Database connection failed**
- Check `DATABASE_URL` is correct
- Verify database is accessible
- Check SSL mode (should be `?sslmode=require` for most providers)

### Runtime Errors

**Error: File uploads fail**
- Check `BLOB_READ_WRITE_TOKEN` is set (if using Vercel Blob)
- Verify file size limits (10MB for Vercel functions)
- Check storage configuration

**Error: Google OAuth fails**
- Verify redirect URIs in Google Cloud Console
- Check `GOOGLE_REDIRECT_URI` matches your Vercel URL
- Ensure environment variables are set for Production environment

### Database Issues

**Migrations fail**
- Make sure you're using `POSTGRES_PRISMA_URL` for migrations
- Check database permissions
- Verify connection string format

## Quick Reference

### Environment Variables Checklist

```
✅ DATABASE_URL
✅ NEXT_PUBLIC_APP_URL
✅ BLOB_READ_WRITE_TOKEN (if using Vercel Blob)
✅ GOOGLE_CLIENT_ID (if using Google)
✅ GOOGLE_CLIENT_SECRET (if using Google)
✅ GOOGLE_REDIRECT_URI (if using Google)
✅ OPENAI_API_KEY (if using AI)
```

### Important URLs to Update

1. **Google OAuth Redirect URIs:**
   - Production: `https://your-app.vercel.app/api/auth/google/callback`
   
2. **Environment Variables:**
   - `NEXT_PUBLIC_APP_URL`: `https://your-app.vercel.app`
   - `GOOGLE_REDIRECT_URI`: `https://your-app.vercel.app/api/auth/google/callback`

## Next Steps

1. ✅ Complete database migration
2. ✅ Deploy to Vercel
3. ✅ Configure environment variables
4. ✅ Set up file storage
5. ✅ Update Google OAuth
6. ✅ Run migrations
7. ✅ Test everything
8. ✅ Set up custom domain (optional)

Need help? Check the troubleshooting section or Vercel's documentation.

