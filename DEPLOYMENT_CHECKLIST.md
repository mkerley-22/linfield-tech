# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Code is committed to Git
- [ ] Repository is pushed to GitHub/GitLab
- [ ] Prisma schema updated to use PostgreSQL
- [ ] All environment variables documented
- [ ] File upload strategy decided (Vercel Blob or external storage)

## Database Setup

- [ ] PostgreSQL database created (Vercel Postgres or external)
- [ ] `DATABASE_URL` connection string obtained
- [ ] Database migrations ready

## Vercel Configuration

- [ ] Vercel account created
- [ ] Project imported from Git repository
- [ ] Build command set: `prisma generate && npm run build`
- [ ] Framework preset: Next.js

## Environment Variables

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel app URL
- [ ] `OPENAI_API_KEY` - (if using AI features)
- [ ] `GOOGLE_CLIENT_ID` - (if using Google integration)
- [ ] `GOOGLE_CLIENT_SECRET` - (if using Google integration)
- [ ] `GOOGLE_REDIRECT_URI` - Production callback URL
- [ ] `GOOGLE_CUSTOM_SEARCH_API_KEY` - (if using image search)
- [ ] `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` - (if using image search)
- [ ] `UNSPLASH_ACCESS_KEY` - (if using Unsplash)

## Google OAuth Setup

- [ ] Google Cloud Console project created
- [ ] OAuth credentials created
- [ ] Production redirect URI added: `https://your-app.vercel.app/api/auth/google/callback`
- [ ] Google Drive API enabled
- [ ] Google Calendar API enabled (if using)

## File Storage

- [ ] Vercel Blob configured OR
- [ ] External storage (S3/Cloudinary) configured
- [ ] Upload routes updated to use chosen storage

## Deployment

- [ ] Code pushed to main branch
- [ ] Vercel deployment triggered
- [ ] Build completed successfully
- [ ] Database migrations run: `npx prisma migrate deploy`

## Post-Deployment Testing

- [ ] Homepage loads
- [ ] User authentication works
- [ ] Pages can be created
- [ ] Pages can be edited
- [ ] File uploads work
- [ ] Public site works (if enabled)
- [ ] Google integration works (if enabled)
- [ ] AI features work (if enabled)

## Custom Domain (Optional)

- [ ] Custom domain added in Vercel
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Domain verified

