# Vercel Deployment Troubleshooting Guide

## Common Errors and Solutions

### 1. Build Fails - Prisma Client Not Generated

**Error:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
- Your `package.json` already has `"build": "prisma generate && next build"` ✅
- Make sure Vercel is using this build command
- In Vercel: Settings → Build & Development Settings → Build Command should be: `prisma generate && npm run build`

### 2. Database Connection Error

**Error:**
```
Can't reach database server
PrismaClientInitializationError
```

**Solution:**
1. Make sure you've created Vercel Postgres:
   - Go to Storage tab → Create Postgres database
2. Add environment variable:
   - Settings → Environment Variables
   - Add: `DATABASE_URL` = `POSTGRES_URL` (copy from Storage tab)
3. Make sure it's set for Production, Preview, AND Development environments

### 3. Missing Environment Variables

**Error:**
```
Environment variable DATABASE_URL is missing
```

**Solution:**
Add in Vercel Settings → Environment Variables:
- `DATABASE_URL` = Your PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` = Your Vercel app URL

### 4. Build Timeout

**Error:**
```
Build exceeded maximum build time
```

**Solution:**
- This usually means Prisma is taking too long
- Make sure `postinstall` script is in package.json (it is ✅)
- Try clearing Vercel build cache

### 5. Module Not Found Errors

**Error:**
```
Module not found: Can't resolve '@/lib/...'
```

**Solution:**
- Check that all imports use `@/` prefix correctly
- Make sure `tsconfig.json` has proper path mapping
- Verify all files are committed to Git

### 6. File Upload Errors

**Error:**
```
BLOB_READ_WRITE_TOKEN is not defined
```

**Solution:**
1. Create Vercel Blob Storage:
   - Storage tab → Create Blob database
2. Copy the Read/Write token
3. Add environment variable: `BLOB_READ_WRITE_TOKEN`

## Step-by-Step Debugging

### Step 1: Check Build Logs
1. Go to your Vercel project
2. Click on the failed deployment
3. Click "View Build Logs"
4. Look for the first error message
5. Copy the exact error

### Step 2: Verify Environment Variables
1. Settings → Environment Variables
2. Make sure these are set:
   - ✅ `DATABASE_URL`
   - ✅ `NEXT_PUBLIC_APP_URL`
   - ⚠️ `BLOB_READ_WRITE_TOKEN` (if using file uploads)
3. Check that they're set for the correct environment (Production/Preview/Development)

### Step 3: Verify Database Setup
1. Storage tab → Check if Postgres database exists
2. If not, create it (Hobby plan is free)
3. Copy the connection strings:
   - `POSTGRES_URL` → Use for `DATABASE_URL`
   - `POSTGRES_PRISMA_URL` → Use for migrations

### Step 4: Check Build Settings
1. Settings → Build & Development Settings
2. Verify:
   - Framework Preset: Next.js
   - Build Command: `prisma generate && npm run build` (or just `npm run build` since it's in package.json)
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 5: Run Migrations
After first successful build:
```bash
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel login
vercel link
npx prisma migrate deploy
```

## Quick Checklist

Before deploying, make sure:
- [ ] Code is pushed to GitHub
- [ ] Vercel Postgres database is created
- [ ] `DATABASE_URL` environment variable is set
- [ ] `NEXT_PUBLIC_APP_URL` is set to your Vercel URL
- [ ] Build command includes `prisma generate`
- [ ] All dependencies are in `package.json`

## Still Having Issues?

Share the exact error message from Vercel build logs, and I can help debug it!


