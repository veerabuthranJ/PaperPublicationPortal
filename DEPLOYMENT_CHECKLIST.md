# Deployment Checklist - Vercel + Render

## ✅ Pre-Deployment Checklist

### Accounts Setup
- [ ] Create Vercel account: https://vercel.com/signup
- [ ] Create Render account: https://render.com/register
- [ ] Create Neon account: https://neon.tech
- [ ] Create Upstash account: https://upstash.com
- [ ] GitHub repository ready with latest code

### Code Preparation
- [ ] All changes committed to Git
- [ ] Pushed to GitHub main branch
- [ ] Frontend `.env.production` created
- [ ] Backend CORS updated for production
- [ ] Test locally one more time

---

## 🗄️ Phase 1: Database Setup (Neon)

### Create PostgreSQL Database
- [ ] Login to Neon console
- [ ] Create new project: `college-publications`
- [ ] Select region (closest to users)
- [ ] Copy connection string (includes `?sslmode=require`)
- [ ] Save connection string for later

**Expected Time:** 5 minutes  
**Cost:** $0/month (Free tier, 500MB)

---

## 🔴 Phase 2: Redis Setup (Upstash)

### Create Redis Database
- [ ] Login to Upstash console
- [ ] Create database: `college-publications-redis`
- [ ] Select same region as PostgreSQL
- [ ] Copy REST URL and Token
- [ ] Save credentials for later

**Expected Time:** 3 minutes  
**Cost:** $0/month (Free tier, 10K commands/day)

---

## 🚀 Phase 3: Backend Deployment (Render)

### Deploy API Server
- [ ] Login to Render dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure settings:
  - Name: `college-publications-api`
  - Root Directory: `backend`
  - Build: `npm install && npx prisma generate && npx prisma db push`
  - Start: `npm run start:prod`
  - Instance: Starter ($7/month)

### Set Environment Variables
- [ ] `DATABASE_URL` = (Neon connection string)
- [ ] `REDIS_HOST` = (Upstash host)
- [ ] `REDIS_PORT` = 6379
- [ ] `REDIS_PASSWORD` = (Upstash token)
- [ ] `NODE_ENV` = production
- [ ] `PORT` = 3000
- [ ] `FRONTEND_URL` = (leave empty for now)

### Deploy & Test
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy backend URL: `https://xxx.onrender.com`
- [ ] Test: `curl https://xxx.onrender.com/api/departments`
- [ ] Seed database via Shell:
  ```bash
  npx prisma db push
  npx prisma db seed
  ```

**Expected Time:** 15 minutes  
**Cost:** $7/month

---

## 🌐 Phase 4: Frontend Deployment (Vercel)

### Update Configuration
- [ ] Edit `frontend/.env.production`
- [ ] Set `VITE_API_URL` = Your Render backend URL + `/api`
- [ ] Commit and push changes

### Deploy to Vercel
- [ ] Login to Vercel dashboard
- [ ] Click "Import Project"
- [ ] Select GitHub repository
- [ ] Configure settings:
  - Framework: Vite
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment: `VITE_API_URL` = (backend URL)

### Deploy & Test
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-3 minutes)
- [ ] Copy frontend URL: `https://xxx.vercel.app`
- [ ] Open in browser
- [ ] Test login: admin / admin123

**Expected Time:** 10 minutes  
**Cost:** $0/month (Free tier)

---

## 🔄 Phase 5: Connect Frontend & Backend

### Update CORS Configuration
- [ ] Go to Render → Backend service → Environment
- [ ] Update `FRONTEND_URL` = Your Vercel URL
- [ ] Save (auto-redeploys backend)
- [ ] Wait 2-3 minutes for redeployment

### Test Connection
- [ ] Open Vercel app in browser
- [ ] Try to login
- [ ] Search should work (0 results initially)
- [ ] Check browser console (no CORS errors)

**Expected Time:** 5 minutes

---

## 👥 Phase 6: Import Faculty Data

### Prepare CSV
- [ ] Edit `faculty_template.csv`
- [ ] Add all faculty members
- [ ] Include ORCID and Google Scholar IDs
- [ ] Save file

### Update Import Script
- [ ] Edit `scripts/import-faculty-csv.js`
- [ ] Change `API_URL` to your Render URL
- [ ] Save file

### Run Import
- [ ] Run: `node scripts/import-faculty-csv.js`
- [ ] Verify: "Successfully imported X faculty"
- [ ] Check Vercel app: Faculty should appear

**Expected Time:** 5 minutes

---

## 📚 Phase 7: Scrape Publications

### Trigger Scraping
- [ ] Run command:
  ```bash
  curl -X POST https://your-backend.onrender.com/api/jobs/scrape/all
  ```
- [ ] Wait 30-60 seconds
- [ ] Check Vercel app
- [ ] Click faculty → See publications

**Expected Time:** 5 minutes + scraping time

---

## ✅ Phase 8: Final Testing

### Functionality Tests
- [ ] Login works (admin / admin123)
- [ ] Search faculty by name works
- [ ] Faculty profile shows publications
- [ ] Publications display correctly
- [ ] Filters work (year, department)
- [ ] Logout works
- [ ] Redirects work (unauthenticated → login)

### Performance Tests
- [ ] Page loads < 3 seconds
- [ ] Search responds < 1 second
- [ ] No console errors
- [ ] Mobile responsive (test on phone)

### Security Tests
- [ ] HTTPS enabled on both services
- [ ] CORS properly configured
- [ ] Database uses SSL
- [ ] Environment variables not exposed

**Expected Time:** 10 minutes

---

## 🎉 Success Criteria

After completing all phases, you should have:

✅ **Frontend:** https://your-app.vercel.app (working)  
✅ **Backend:** https://your-api.onrender.com (working)  
✅ **Database:** Neon PostgreSQL (connected)  
✅ **Redis:** Upstash (connected)  
✅ **Faculty:** Imported and visible  
✅ **Publications:** Scraped and displayed  
✅ **Login:** Working with admin credentials  
✅ **Search:** Fully functional  

---

## 📊 Cost Summary

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Render | Starter | $7 |
| Neon | Free | $0 (upgrade to $10 if >500MB) |
| Upstash | Free | $0 (upgrade to $5 if >10K cmds/day) |
| **Total** | | **$7-22/month** |

---

## 🔧 Optional: Custom Domain

### Vercel Domain
- [ ] Go to Vercel → Settings → Domains
- [ ] Add: `publications.yourcollege.edu`
- [ ] Configure DNS as shown
- [ ] Wait for DNS propagation
- [ ] Update backend FRONTEND_URL

### Render Domain
- [ ] Go to Render → Settings → Custom Domains
- [ ] Add: `api.yourcollege.edu`
- [ ] Configure CNAME record
- [ ] Update frontend VITE_API_URL

**Expected Time:** 15 minutes + DNS wait (up to 1 hour)

---

## 📝 Post-Deployment Tasks

### Week 1
- [ ] Monitor error logs (Render dashboard)
- [ ] Check usage metrics (Vercel dashboard)
- [ ] Test from different devices/browsers
- [ ] Gather feedback from users

### Week 2
- [ ] Optimize slow queries (check logs)
- [ ] Add more faculty if needed
- [ ] Update publications: `curl -X POST .../api/jobs/scrape/all`
- [ ] Consider upgrading tiers if needed

### Monthly
- [ ] Review usage and costs
- [ ] Update publications (weekly recommended)
- [ ] Check database size (upgrade if >450MB)
- [ ] Review analytics and feedback

---

## 🆘 Troubleshooting

### Frontend shows blank page
**Check:**
- Vercel build logs for errors
- Browser console for JavaScript errors
- VITE_API_URL is correct

### "Network Error" on search
**Check:**
- Backend is running (visit backend URL)
- CORS configured correctly
- FRONTEND_URL set in Render
- Check browser network tab

### No publications appearing
**Check:**
- Faculty imported successfully
- Scraping job ran: Check Render logs
- Database has data: Run query in Neon console
- Frontend API URL is correct

### Backend won't start
**Check:**
- DATABASE_URL is correct (includes `?sslmode=require`)
- Redis credentials are correct
- Build command succeeded
- Check Render logs for errors

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Upstash Docs:** https://docs.upstash.com

---

## ⏱️ Total Time Estimate

- Database setup: 5 min
- Redis setup: 3 min
- Backend deploy: 15 min
- Frontend deploy: 10 min
- Connect services: 5 min
- Import data: 5 min
- Scrape publications: 5 min
- Testing: 10 min

**Total: ~60 minutes** ⏰

---

## 🎯 Next Steps After Deployment

1. **Share with colleagues** - Get feedback
2. **Add more faculty** - Import additional members
3. **Schedule weekly scraping** - Keep publications updated
4. **Monitor costs** - Track usage, upgrade if needed
5. **Custom domain** - Professional URL
6. **Analytics** - Add Google Analytics
7. **Backups** - Configure automated backups
8. **Documentation** - User guide for faculty

---

Good luck with your deployment! 🚀

Remember: Start small, test thoroughly, then scale as needed!
