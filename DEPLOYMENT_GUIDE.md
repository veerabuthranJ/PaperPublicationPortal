# Deployment Guide - Vercel + Render

## Overview

This guide will help you deploy:
- **Frontend** → Vercel (Free)
- **Backend** → Render ($7/month)
- **Database** → Neon or Render PostgreSQL ($0-10/month)
- **Redis** → Upstash ($0-5/month)

**Total Time:** 30-45 minutes  
**Total Cost:** $7-22/month

---

## Prerequisites

✅ GitHub account  
✅ Vercel account (free) - https://vercel.com/signup  
✅ Render account (free) - https://render.com/register  
✅ Neon account (free) - https://neon.tech  
✅ Upstash account (free) - https://upstash.com  
✅ Code pushed to GitHub

---

## Phase 1: Setup Database (Neon PostgreSQL)

### Step 1: Create Neon Database

1. **Go to:** https://console.neon.tech
2. **Click:** "Create a project"
3. **Enter:**
   - Project name: `college-publications`
   - Database name: `publications`
   - Region: Choose closest to your users
4. **Click:** "Create project"

### Step 2: Get Connection String

1. **Copy** the connection string shown:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/publications?sslmode=require
   ```
2. **Save it** - you'll need it for Render!

**Important:** Neon URLs include `?sslmode=require` - keep this!

---

## Phase 2: Setup Redis (Upstash)

### Step 1: Create Redis Database

1. **Go to:** https://console.upstash.com
2. **Click:** "Create database"
3. **Enter:**
   - Name: `college-publications-redis`
   - Region: Choose same as your database
   - Type: Regional (cheaper)
4. **Click:** "Create"

### Step 2: Get Connection Details

1. **Copy** these values:
   - **UPSTASH_REDIS_REST_URL:** `https://xxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN:** `AxxxYYY...`
2. **Save them** for Render configuration!

---

## Phase 3: Deploy Backend (Render)

### Step 1: Connect GitHub

1. **Go to:** https://dashboard.render.com
2. **Click:** "New +"
3. **Select:** "Web Service"
4. **Connect:** Your GitHub repository
5. **Select:** Your `PaperPublicationPortal` repo

### Step 2: Configure Service

**Basic Settings:**
- **Name:** `college-publications-api`
- **Region:** Same as your database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npx prisma generate && npx prisma db push`
- **Start Command:** `npm run start:prod`

**Instance Type:**
- Select: **Starter ($7/month)** - 512MB RAM, always-on

### Step 3: Environment Variables

Click "Advanced" → Add these environment variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/publications?sslmode=require

# Redis
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-token

# Application
NODE_ENV=production
PORT=3000

# CORS (you'll update this after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app

# Optional: API Keys (if using external scrapers)
IEEE_API_KEY=your-key-here
SERP_API_KEY=your-key-here
```

**Important:** 
- Use the DATABASE_URL from Neon (Step 1)
- Use Redis credentials from Upstash (Step 2)
- Leave FRONTEND_URL as placeholder for now

### Step 4: Deploy

1. **Click:** "Create Web Service"
2. **Wait:** 5-10 minutes for build
3. **Copy** your backend URL: `https://college-publications-api.onrender.com`

### Step 5: Test Backend

Once deployed, test:
```bash
curl https://your-backend-url.onrender.com/api/departments
```

Should return JSON with departments!

### Step 6: Run Database Migrations

1. **Go to:** Render Dashboard → Your service
2. **Click:** "Shell" tab
3. **Run:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

This creates tables and seeds departments!

---

## Phase 4: Deploy Frontend (Vercel)

### Step 1: Update Environment Variables

**Edit:** `frontend/.env.production` (create if doesn't exist)

```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url` with your actual Render URL!

### Step 2: Commit Changes

```bash
git add frontend/.env.production
git commit -m "Add production environment config"
git push origin main
```

### Step 3: Connect to Vercel

1. **Go to:** https://vercel.com/new
2. **Click:** "Import Git Repository"
3. **Select:** Your `PaperPublicationPortal` repo
4. **Click:** "Import"

### Step 4: Configure Project

**Framework Preset:** Vite  
**Root Directory:** `frontend`  
**Build Command:** `npm run build`  
**Output Directory:** `dist`

**Environment Variables:**
```bash
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### Step 5: Deploy

1. **Click:** "Deploy"
2. **Wait:** 2-3 minutes
3. **Copy** your frontend URL: `https://your-app.vercel.app`

---

## Phase 5: Update CORS

### Step 1: Update Backend Environment

1. **Go to:** Render Dashboard → Your backend service
2. **Click:** "Environment" tab
3. **Update:**
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. **Click:** "Save Changes"
5. Service will auto-redeploy

### Step 2: Update CORS in Code (if needed)

**File:** `backend/src/main.ts`

```typescript
app.enableCors({
  origin: [
    'http://localhost:5174',
    'http://localhost:5173',
    'https://your-app.vercel.app',  // Add your Vercel URL
  ],
  credentials: true,
});
```

Commit and push if changed.

---

## Phase 6: Import Faculty Data

### Option 1: Local Import (Recommended)

1. **Edit** `faculty_template.csv` with your faculty
2. **Update** `scripts/import-faculty-csv.js`:
   ```javascript
   const API_URL = 'https://your-backend-url.onrender.com/api';
   ```
3. **Run:**
   ```bash
   node scripts/import-faculty-csv.js
   ```

### Option 2: Direct Database Access

1. **Connect** to Neon database:
   ```bash
   psql "postgresql://user:pass@ep-xxx.neon.tech/publications?sslmode=require"
   ```
2. **Insert** faculty manually via SQL

---

## Phase 7: Scrape Publications

After importing faculty:

```bash
curl -X POST https://your-backend-url.onrender.com/api/jobs/scrape/all
```

Wait 30-60 seconds, then check frontend!

---

## Phase 8: Custom Domain (Optional)

### Vercel Custom Domain

1. **Go to:** Vercel Dashboard → Your project
2. **Click:** "Settings" → "Domains"
3. **Add:** `publications.yourcollege.edu`
4. **Configure** DNS records as shown
5. **Wait:** DNS propagation (5-60 min)

### Render Custom Domain

1. **Go to:** Render Dashboard → Your service
2. **Click:** "Settings" → "Custom Domains"
3. **Add:** `api.yourcollege.edu`
4. **Configure** CNAME record
5. **Update** frontend `VITE_API_URL` to use new domain

---

## Troubleshooting

### Frontend shows "Network Error"

**Problem:** CORS blocking API requests

**Solution:**
1. Check FRONTEND_URL in Render environment
2. Verify CORS origins in `backend/src/main.ts`
3. Check browser console for exact error

### Backend won't start

**Problem:** Database connection failed

**Solution:**
1. Verify DATABASE_URL is correct
2. Check Neon database is active
3. Ensure `?sslmode=require` is in URL
4. Check Render logs: Dashboard → Logs tab

### "No publications found"

**Problem:** Database not seeded

**Solution:**
1. Connect to Render Shell
2. Run: `npx prisma db push && npx prisma db seed`
3. Import faculty: `node scripts/import-faculty-csv.js`
4. Trigger scraping: `curl -X POST .../api/jobs/scrape/all`

### Redis connection error

**Problem:** Wrong Redis credentials

**Solution:**
1. Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
2. For Upstash, use REST URL format
3. Check Upstash dashboard for correct values

---

## Cost Optimization Tips

### Free Tier Limits

**Vercel:**
- 100 GB bandwidth/month (plenty for small college)
- Unlimited deployments
- Automatic SSL

**Render:**
- Free tier sleeps after 15 min (not recommended)
- $7/month = always-on (recommended)

**Neon:**
- 500 MB free (good for 50+ faculty)
- $10/month = 5 GB (100+ faculty)

**Upstash:**
- 10,000 commands/day free (sufficient for small usage)
- $5/month = 50,000 commands/day

### When to Upgrade

**Upgrade backend** ($7 → $21/month) when:
- More than 100 faculty
- High traffic (1000+ visitors/day)
- Need faster response times

**Upgrade database** ($0 → $10/month) when:
- Database exceeds 500 MB
- More than 50 faculty
- Need automated backups

**Upgrade Redis** ($0 → $5/month) when:
- Exceeding 10,000 daily commands
- Running frequent scraping jobs
- Need longer cache TTL

---

## Monitoring & Maintenance

### Check Deployment Status

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- View deployments, analytics, errors

**Render:**
- Dashboard: https://dashboard.render.com
- View logs, metrics, health checks

### Update Publications Weekly

**Option 1: Manual Trigger**
```bash
curl -X POST https://your-backend-url.onrender.com/api/jobs/scrape/all
```

**Option 2: Cron Job (Future Enhancement)**
- Add cron service in Render
- Schedule weekly scraping
- Email notifications on completion

### Database Backups

**Neon:**
- Automatic daily backups on paid plans
- Manual backup: Export via `pg_dump`

**Render PostgreSQL:**
- Automatic daily backups
- 7-day retention

---

## Security Checklist

✅ Environment variables not committed to Git  
✅ CORS configured with specific domains  
✅ Database uses SSL connection  
✅ Redis password protected  
✅ API rate limiting enabled (Render auto)  
✅ HTTPS enforced on both services  
✅ Admin credentials changed from default

---

## Success Checklist

After deployment, verify:

✅ Frontend loads: `https://your-app.vercel.app`  
✅ Login works: username=admin, password=admin123  
✅ Search faculty: Enter name, see results  
✅ Faculty profile: Click faculty, see publications  
✅ Publications display: See titles, years, citations  
✅ Logout works: Click logout, redirected to login  
✅ Mobile responsive: Test on phone

---

## Support & Resources

**Vercel Docs:** https://vercel.com/docs  
**Render Docs:** https://render.com/docs  
**Neon Docs:** https://neon.tech/docs  
**Upstash Docs:** https://docs.upstash.com

**Need Help?**
- Check logs in Render/Vercel dashboard
- Test API endpoints with curl
- Check browser console for frontend errors

---

## Estimated Deployment Time

- Database setup (Neon): 5 minutes
- Redis setup (Upstash): 3 minutes
- Backend deploy (Render): 10 minutes
- Frontend deploy (Vercel): 5 minutes
- Configuration & testing: 10 minutes
- Faculty import: 5 minutes
- **Total: ~40 minutes**

---

## Monthly Cost Summary

**Recommended Setup:**
```
Vercel (Frontend):     $0/month
Render (Backend):      $7/month
Neon (Database):      $10/month (or $0 if <500MB)
Upstash (Redis):       $5/month (or $0 if <10K cmds/day)
───────────────────────────────────
Total:             $12-22/month
```

Compare to traditional hosting: $50-200/month!

---

## Next Steps

1. ✅ Create accounts (Vercel, Render, Neon, Upstash)
2. ✅ Follow Phase 1-5 deployment steps
3. ✅ Import faculty data
4. ✅ Test complete system
5. ✅ (Optional) Setup custom domain
6. ✅ Monitor for 1 week
7. ✅ Share with administration!

Good luck! 🚀
