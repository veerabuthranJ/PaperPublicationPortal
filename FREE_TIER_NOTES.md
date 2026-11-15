# Render Free Tier Configuration

## ⚠️ Free Tier Limitations

Your backend is configured for Render's **FREE tier**:

### What This Means:

1. **Service Sleeps After 15 Minutes**
   - Your API will "sleep" after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds to "wake up"
   - Subsequent requests are fast

2. **No Shell Access**
   - Can't run manual commands like `npx prisma db push`
   - Database initialization happens automatically during build and startup

3. **Limited Resources**
   - 512 MB RAM
   - Shared CPU
   - Good enough for small college with <100 faculty

4. **Monthly Hours Limit**
   - 750 hours/month free (enough for 24/7 uptime)
   - Resets every month

---

## ✅ What's Been Configured

### Automatic Database Setup
- `npx prisma db push` runs during build (creates tables)
- Database seeds automatically on first startup
- No manual commands needed!

### Free Tier Optimizations
- Plan set to: `free` in render.yaml
- Database initialization in build command
- Auto-seeding on application start

---

## 🚀 How to Deploy on Free Tier

### 1. Update Render Settings

Go to: https://dashboard.render.com/web/paperpublicationportal

Click **Settings** → Update these fields:

**Plan:** Free

**Build Command:**
```
cd backend && npm install --include=dev && npx prisma generate && npx prisma db push --accept-data-loss && npm run build
```

**Start Command:**
```
cd backend && node dist/src/main.js
```

**Root Directory:** (leave blank)

### 2. Environment Variables (Required)

Click **Environment** tab:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_fLphIO6BcV2w@ep-mute-paper-betya2p2-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NODE_ENV=production

PORT=3000

JWT_SECRET=WWdS+Mc/81s84btFxn48N546CnQcu8uh3l9/fdbmA24=

FRONTEND_URL=http://localhost:5174

# Redis (optional - use localhost for free tier)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Save and Deploy

- Click **"Save Changes"**
- Wait 5-10 minutes
- Service will be live at: https://paperpublicationportal.onrender.com

---

## 🎯 What Happens During Deployment

1. ✅ Install packages
2. ✅ Generate Prisma client
3. ✅ Push database schema (create tables)
4. ✅ Build application
5. ✅ Start application
6. ✅ Auto-seed database (departments + admin)

All automatic - no shell commands needed!

---

## 🧪 Testing Your API

Once deployed, test these:

**Health Check:**
```
https://paperpublicationportal.onrender.com/api/departments
```

**API Documentation:**
```
https://paperpublicationportal.onrender.com/api/docs
```

**Login:**
```bash
curl -X POST https://paperpublicationportal.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## ⚡ Dealing with Sleep (15-min Timeout)

### Problem
Free tier sleeps after 15 minutes. First request after sleep is slow (30-60s).

### Solutions

**Option 1: Keep-Alive Service (Free)**
Use a service like:
- **UptimeRobot** (https://uptimerobot.com) - Free
- **Cron-job.org** (https://cron-job.org) - Free

Set them to ping your API every 10 minutes:
```
https://paperpublicationportal.onrender.com/api/departments
```

**Option 2: Upgrade to Starter Plan**
- $7/month
- Never sleeps
- More resources
- Better performance

**Option 3: Accept the Sleep**
- First request slow, rest are fast
- Good for low-traffic sites
- Free!

---

## 📊 Cost Comparison

| Plan | Cost | Sleep | Resources | Best For |
|------|------|-------|-----------|----------|
| **Free** | $0 | After 15 min | 512 MB | Testing, low traffic |
| **Starter** | $7/mo | Never | 512 MB | Small production |
| **Standard** | $25/mo | Never | 2 GB | High traffic |

---

## 🔄 Upgrading Later

To upgrade from Free to Starter:
1. Go to Render Dashboard → Your service
2. Click **Settings** → **Instance Type**
3. Select **Starter**
4. Click **Save Changes**
5. No code changes needed!

---

## ⚠️ Important Notes

### Redis (Job Queue)
- Free tier configured with `localhost` Redis
- Scraping jobs **won't work** without real Redis
- Options:
  - Add Upstash Redis (free tier) - See deployment guide
  - Upgrade and add Redis later
  - Use without scraping (CRUD operations work fine)

### Database
- Neon free tier: 0.5 GB storage
- Enough for 50+ faculty members
- Upgrade when you exceed limit

### Performance
- Free tier is slower than paid
- Good for testing and small colleges
- Upgrade if you need better performance

---

## 🆘 Troubleshooting

### "Service Unavailable" after deployment
- Wait 1-2 minutes after "Live" status
- Service might still be initializing

### "Database connection error"
- Verify DATABASE_URL is correct
- Check Neon dashboard - database should be active

### "Application failed to start"
- Check logs for errors
- Verify environment variables are set
- Build command might have failed

### Changes not deploying
- Commit and push to GitHub first
- Render auto-deploys on git push
- Or manually trigger: Dashboard → Manual Deploy

---

## ✅ Success Checklist

- [ ] Updated Render settings (Build & Start commands)
- [ ] Added all environment variables
- [ ] Pushed latest code to GitHub
- [ ] Deployment completed successfully
- [ ] API returns JSON from /api/departments
- [ ] Can login with admin/admin123
- [ ] API docs accessible

---

## 🎉 You're Done!

Your backend is live on Render Free Tier!

**URL:** https://paperpublicationportal.onrender.com

**Next:** Deploy frontend to Vercel (also free)

Need help? Check the logs in Render Dashboard!
