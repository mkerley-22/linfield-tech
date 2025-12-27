# Development Workflow Guide

This guide explains how to sync production data to local, make changes, and deploy everything together.

## Overview

**Typical Workflow:**
1. Pull production environment variables to local
2. Sync production database to local (optional, for testing with real data)
3. Make your changes locally
4. Test locally
5. Commit and push to Git
6. Vercel automatically deploys (or manually redeploy)

## Step 1: Pull Production Environment Variables

Always start by syncing your environment variables:

```bash
vercel env pull .env.local
```

This updates `.env.local` with all production environment variables from Vercel.

**Then update your local `.env` file:**
```bash
# Copy DATABASE_URL from .env.local to .env for Prisma
grep "^DATABASE_URL=" .env.local >> .env.tmp
# Or manually copy the DATABASE_URL value
```

## Step 2: Sync Production Database to Local (Optional)

If you want to work with production data locally:

### Option A: Use Production Database Directly (Not Recommended)
- Your `.env` will point to production Supabase
- **⚠️ WARNING**: Any changes will affect production!
- Only do this if you're very careful

### Option B: Create a Local Copy (Recommended)

1. **Export production data:**
   ```bash
   # Using Prisma Studio (pointing to production)
   DATABASE_URL="your-production-url" npx prisma studio
   # Export data manually, or use a script
   ```

2. **Or use Supabase's built-in tools:**
   - Go to Supabase Dashboard → Database → Backups
   - Download a backup
   - Restore to a local Supabase instance

3. **Or use a local PostgreSQL:**
   ```bash
   # Install PostgreSQL locally
   brew install postgresql  # macOS
   
   # Create local database
   createdb knowledge_base_local
   
   # Update .env to point to local database
   DATABASE_URL="postgresql://localhost:5432/knowledge_base_local"
   
   # Push schema
   npx prisma db push
   
   # Import production data (if you exported it)
   ```

## Step 3: Make Your Changes Locally

1. **Create a new branch** (recommended):
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your code changes:**
   - Edit files
   - Test locally with `npm run dev`

3. **Test database changes:**
   ```bash
   # If you changed the Prisma schema
   npx prisma db push  # For development
   # Or create a migration
   npx prisma migrate dev --name your-migration-name
   ```

## Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test your changes.

## Step 5: Commit and Push

```bash
# Stage your changes
git add .

# Commit
git commit -m "Description of your changes"

# Push to GitHub
git push origin feature/your-feature-name
```

## Step 6: Deploy to Production

### Option A: Automatic Deployment (Recommended)
- Vercel automatically deploys when you push to `main` branch
- For feature branches, Vercel creates preview deployments

### Option B: Manual Deployment
1. Merge your branch to `main`:
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

2. Or manually redeploy in Vercel:
   - Go to Deployments
   - Click "..." → "Redeploy"

## Step 7: Run Database Migrations (If Schema Changed)

If you changed the Prisma schema and created migrations:

```bash
# Pull production env vars
vercel env pull .env.local

# Update .env with production DATABASE_URL
# (copy from .env.local)

# Run migrations on production
npx prisma migrate deploy
```

Or use Vercel's database tools in the Storage tab.

## Quick Reference Commands

### Start Development Session
```bash
# 1. Pull latest env vars
vercel env pull .env.local

# 2. Update .env with DATABASE_URL
# (manually copy from .env.local)

# 3. Start dev server
npm run dev
```

### Before Deploying
```bash
# 1. Test locally
npm run dev

# 2. Build test
npm run build

# 3. Commit and push
git add .
git commit -m "Your changes"
git push origin main
```

### After Schema Changes
```bash
# 1. Create migration locally
npx prisma migrate dev --name migration-name

# 2. Push to Git
git add prisma/migrations
git commit -m "Add database migration"
git push

# 3. Deploy to production
# (Vercel auto-deploys)

# 4. Run migration on production
vercel env pull .env.local
# Update .env with production DATABASE_URL
npx prisma migrate deploy
```

## Best Practices

1. **Always pull env vars before starting work:**
   ```bash
   vercel env pull .env.local
   ```

2. **Use feature branches:**
   - Don't work directly on `main`
   - Create branches for features/fixes

3. **Test locally first:**
   - Run `npm run dev` and test thoroughly
   - Run `npm run build` to catch build errors

4. **Commit database migrations:**
   - Always commit `prisma/migrations/` folder
   - Don't commit `.env` or `.env.local` files

5. **Sync database schema:**
   - Use `npx prisma db push` for quick dev changes
   - Use `npx prisma migrate dev` for tracked migrations

## Troubleshooting

### "Environment variable not found"
```bash
# Pull latest env vars
vercel env pull .env.local
# Update .env file
```

### "Database connection error"
- Check `DATABASE_URL` in `.env` matches production
- Verify Supabase database is running
- Check network/firewall settings

### "Schema out of sync"
```bash
# Pull latest schema from production
npx prisma db pull  # This creates a new schema from existing DB

# Or push your local schema
npx prisma db push
```

## Summary

**Daily Workflow:**
1. `vercel env pull .env.local` - Get latest env vars
2. Update `.env` with `DATABASE_URL`
3. `npm run dev` - Start developing
4. Make changes, test locally
5. `git add . && git commit -m "..." && git push` - Deploy
6. Vercel auto-deploys or manually redeploy

**For Database Changes:**
1. Make schema changes
2. `npx prisma migrate dev --name ...` - Create migration
3. Test locally
4. Push to Git
5. `npx prisma migrate deploy` - Run on production

