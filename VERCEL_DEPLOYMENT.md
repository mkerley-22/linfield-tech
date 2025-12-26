# Vercel Deployment Guide

This guide will walk you through deploying your Knowledge Base application to Vercel.

## ⚠️ Important: Database Migration Required

**Your app currently uses SQLite (file-based database), which doesn't work on Vercel.** You need to migrate to PostgreSQL. This guide includes those steps.

## Prerequisites

1. **GitHub/GitLab/Bitbucket account** - Your code needs to be in a Git repository
2. **Vercel account** - Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL database** - We'll use Vercel Postgres (free tier available)

## Step 1: Prepare Your Code for Git

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to [GitHub](https://github.com/new)
   - Create a new repository
   - **Don't** initialize with README (you already have code)

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Migrate Database to PostgreSQL

### Option A: Use Vercel Postgres (Recommended - Free Tier Available)

1. **Update Prisma Schema**:
   - Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`

2. **Update package.json** to include postinstall script:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

### Option B: Use External PostgreSQL (Supabase, Railway, etc.)

1. Sign up for a PostgreSQL service (e.g., [Supabase](https://supabase.com) - free tier)
2. Get your connection string
3. Update Prisma schema as above

## Step 3: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Step 4: Create Vercel Project

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. Click **"Add New..."** → **"Project"**
3. **Import your Git repository**:
   - Connect your GitHub/GitLab account if needed
   - Select your repository
   - Click **"Import"**

## Step 5: Configure Vercel Project

### A. Add Vercel Postgres (if using Option A)

1. In your Vercel project, go to **"Storage"** tab
2. Click **"Create Database"** → **"Postgres"**
3. Select **"Hobby"** (free tier)
4. Click **"Create"**
5. Vercel will automatically add `POSTGRES_URL` environment variable

### B. Configure Environment Variables

Go to **"Settings"** → **"Environment Variables"** and add:

#### Required Variables:
```
DATABASE_URL=your_postgres_connection_string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Optional Variables (if using these features):
```
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
GOOGLE_CUSTOM_SEARCH_API_KEY=your_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id
UNSPLASH_ACCESS_KEY=your_key
```

**Important Notes:**
- For `GOOGLE_REDIRECT_URI`, use your Vercel URL (e.g., `https://your-app.vercel.app/api/auth/google/callback`)
- Update Google OAuth settings to include your production URL
- Add variables for **Production**, **Preview**, and **Development** environments

## Step 6: Configure Build Settings

Vercel should auto-detect Next.js, but verify:

1. **Framework Preset**: Next.js
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `.next` (default)
4. **Install Command**: `npm install` (default)

### Add Build Command for Prisma:

In **"Settings"** → **"Build & Development Settings"**, update:

**Build Command:**
```bash
prisma generate && npm run build
```

Or add to `package.json`:
```json
"scripts": {
  "build": "prisma generate && next build"
}
```

## Step 7: Update next.config.js

Update your `next.config.js` to handle file uploads and images:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-vercel-app.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
```

## Step 8: Handle File Uploads

Vercel has a **10MB limit** for serverless functions. For file uploads, you have two options:

### Option A: Use Vercel Blob Storage (Recommended)
1. Install: `npm install @vercel/blob`
2. Update upload routes to use Vercel Blob
3. See [Vercel Blob docs](https://vercel.com/docs/storage/vercel-blob)

### Option B: Use External Storage (S3, Cloudinary, etc.)
- Configure your upload routes to use external storage
- Update file paths in your code

## Step 9: Run Database Migrations

After deployment, you need to run migrations:

1. **Option A: Use Vercel CLI** (Recommended):
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   npx prisma migrate deploy
   ```

2. **Option B: Use Vercel Dashboard**:
   - Go to your project → **"Deployments"**
   - Click on a deployment → **"Functions"** tab
   - Or use Vercel's built-in database tools

## Step 10: Deploy

1. **Push to your main branch**:
   ```bash
   git push origin main
   ```

2. **Vercel will automatically deploy** your changes

3. **Monitor the deployment**:
   - Go to your Vercel dashboard
   - Watch the build logs
   - Check for any errors

## Step 11: Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] Google OAuth redirect URIs updated
- [ ] Test file uploads (if using external storage)
- [ ] Test authentication
- [ ] Test page creation/editing
- [ ] Verify public site works (if enabled)

## Troubleshooting

### Build Fails with Prisma Error
- Make sure `prisma generate` runs before build
- Check that `DATABASE_URL` is set correctly

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database?sslmode=require`
- Check database is accessible from Vercel's IPs

### File Upload Issues
- Vercel has 10MB limit - use external storage for larger files
- Check file paths are correct

### Environment Variables Not Working
- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables

## Next Steps

1. **Set up custom domain** (optional):
   - Go to **"Settings"** → **"Domains"**
   - Add your custom domain
   - Follow DNS setup instructions

2. **Enable Analytics** (optional):
   - Go to **"Analytics"** tab
   - Enable Vercel Analytics

3. **Set up monitoring**:
   - Configure error tracking
   - Set up uptime monitoring

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

