# 🚀 Quick Deployment Guide - Vercel + Render

## TL;DR - 4 Simple Steps

### 1️⃣ Setup Accounts (5 min)
```bash
✅ Vercel:  https://vercel.com/signup (FREE)
✅ Render:  https://render.com/register (need credit card)
✅ Neon:    https://neon.tech (FREE)
✅ Upstash: https://upstash.com (FREE)
```

### 2️⃣ Deploy Backend (15 min)
```bash
1. Neon: Create database → Copy connection string
2. Upstash: Create Redis → Copy credentials
3. Render: New Web Service → Connect GitHub
   - Root: backend
   - Build: npm install && npx prisma generate && npx prisma db push
   - Start: npm run start:prod
   - Add environment variables (DATABASE_URL, REDIS_HOST, etc.)
4. Copy backend URL: https://xxx.onrender.com
```

### 3️⃣ Deploy Frontend (10 min)
```bash
1. Edit frontend/.env.production:
   VITE_API_URL=https://your-backend.onrender.com/api

2. Commit and push to GitHub

3. Vercel: Import Project → Connect GitHub
   - Root: frontend
   - Framework: Vite
   - Add environment variable: VITE_API_URL

4. Copy frontend URL: https://xxx.vercel.app
```

### 4️⃣ Connect & Test (10 min)
```bash
1. Render: Update FRONTEND_URL environment variable

2. Import faculty:
   node scripts/import-faculty-csv.js

3. Scrape publications:
   curl -X POST https://your-backend.onrender.com/api/jobs/scrape/all

4. Open https://your-app.vercel.app
   Login: admin / admin123
```

---

## 💰 Monthly Cost

```
Vercel (Frontend):    $0/month   ✅ FREE
Render (Backend):     $7/month   💵 Paid
Neon (Database):      $0/month   ✅ FREE (500MB)
Upstash (Redis):      $0/month   ✅ FREE (10K cmds/day)
────────────────────────────────────────
Total:                $7/month   🎉
```

**Upgrade when:**
- Database > 500 MB → Neon $10/month
- Redis > 10K commands/day → Upstash $5/month
- Total: $12-22/month max

---

## 🌐 URLs After Deployment

```
Frontend:     https://your-app.vercel.app
Backend API:  https://your-api.onrender.com/api
Database:     Neon PostgreSQL (managed)
Redis:        Upstash (managed)
```

---

## 📋 Environment Variables Needed

### Backend (Render)
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/publications?sslmode=require
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-token
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel)
```bash
VITE_API_URL=https://your-api.onrender.com/api
```

---

## ✅ Success Checklist

After deployment:

- [ ] Open frontend URL → See login page
- [ ] Login with admin/admin123 → Redirects to search
- [ ] Search shows faculty (after import)
- [ ] Click faculty → Shows publications
- [ ] No CORS errors in console
- [ ] Logout works

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page | Check Vercel build logs |
| CORS error | Update FRONTEND_URL in Render |
| Backend won't start | Check DATABASE_URL has `?sslmode=require` |
| No publications | Run import + scraping commands |

---

## 📞 Full Documentation

For detailed step-by-step guide, see:
- **DEPLOYMENT_GUIDE.md** - Complete walkthrough
- **DEPLOYMENT_CHECKLIST.md** - Phase-by-phase checklist

---

## ⏱️ Time Required

```
Setup accounts:     5 min
Deploy backend:    15 min
Deploy frontend:   10 min
Connect & test:    10 min
────────────────────────
Total:            ~40 min
```

---

## 🎯 Pro Tips

1. **Start with free tiers** - Upgrade only when needed
2. **Test locally first** - Make sure everything works
3. **Use same region** - Backend, database, Redis in same region = faster
4. **Monitor logs** - First week, check Render logs daily
5. **Weekly scraping** - Update publications once a week

---

## 🔥 Common Mistakes to Avoid

❌ Forgetting `?sslmode=require` in DATABASE_URL  
❌ Not updating FRONTEND_URL after deploying frontend  
❌ Using http:// instead of https:// in production  
❌ Forgetting to seed database after deployment  
❌ Not importing faculty before scraping  

---

## 📈 Scaling Guide

**Small College (10-20 faculty):**
- Stick with free tiers = $7/month total

**Medium College (50-100 faculty):**
- Upgrade database to $10/month = $17/month total

**Large College (200+ faculty):**
- Upgrade all services = $40-60/month total

---

Ready to deploy? Follow the 4 steps above! 🚀

Questions? Check **DEPLOYMENT_GUIDE.md** for detailed instructions.
