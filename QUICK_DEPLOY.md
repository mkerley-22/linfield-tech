# Quick Vercel Deployment Guide

## ⚡ Fast Track (5 minutes)

### 1. Update Prisma Schema ✅
Already done! Changed from SQLite to PostgreSQL.

### 2. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 3. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up/Login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Click **"Deploy"**

### 4. Add Vercel Postgres
1. In your project → **"Storage"** tab
2. Click **"Create Database"** → **"Postgres"** → **"Hobby"** (free)
3. Vercel automatically adds `POSTGRES_URL` and `POSTGRES_PRISMA_URL`

### 5. Set Environment Variables
Go to **Settings** → **Environment Variables**:

**Required:**
- `DATABASE_URL` = `POSTGRES_URL` (from Vercel Postgres)
- `NEXT_PUBLIC_APP_URL` = `https://your-app.vercel.app`

**For migrations:**
- `POSTGRES_PRISMA_URL` = (automatically added by Vercel)

**Optional (if using):**
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` = `https://your-app.vercel.app/api/auth/google/callback`
- `BLOB_READ_WRITE_TOKEN` (for file uploads - get from Vercel Blob Storage)

### 6. Add Vercel Blob Storage (for file uploads)
1. **Storage** tab → **"Create Database"** → **"Blob"** → **"Hobby"** (free)
2. Copy the **"Read and Write Token"**
3. Add as `BLOB_READ_WRITE_TOKEN` environment variable

### 7. Run Database Migrations
After first deployment:
```bash
npm install -g vercel
vercel login
vercel link
npx prisma migrate deploy
```

### 8. Update Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Edit your OAuth client
4. Add redirect URI: `https://your-app.vercel.app/api/auth/google/callback`
5. Save

### 9. Redeploy
After adding environment variables, Vercel will auto-redeploy, or:
- Go to **Deployments** → Click **"Redeploy"**

## ✅ Done!

Your app should now be live at `https://your-app.vercel.app`

## Troubleshooting

**Build fails?**
- Check build logs in Vercel dashboard
- Make sure `DATABASE_URL` is set
- Verify Prisma generates: build command includes `prisma generate`

**Database connection fails?**
- Use `POSTGRES_URL` for app, `POSTGRES_PRISMA_URL` for migrations
- Check SSL mode in connection string

**File uploads don't work?**
- Make sure `BLOB_READ_WRITE_TOKEN` is set
- Check file size (10MB limit for Vercel functions)

**Need help?** See `SETUP_VERCEL.md` for detailed instructions.

