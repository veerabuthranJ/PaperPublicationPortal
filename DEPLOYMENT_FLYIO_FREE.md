# Free Deployment with Fly.io - $0/month

## Overview

Deploy your entire application for **FREE** using:
- **Frontend:** Vercel (Free)
- **Backend:** Fly.io (Free) ⭐ **No sleep!**
- **Database:** Neon (Free)
- **Redis:** Upstash (Free)

**Total Cost:** $0/month  
**Always-On:** YES! (No sleep delays)

---

## Prerequisites

✅ GitHub account  
✅ Vercel account (free)  
✅ Fly.io account (free, requires credit card for verification)  
✅ Neon account (free)  
✅ Upstash account (free)  

---

## Phase 1: Setup Fly.io Account

### Step 1: Sign Up
1. Go to: https://fly.io/app/sign-up
2. Sign up with GitHub or email
3. **Verify email**
4. **Add payment method** (required, but won't be charged on free tier)

### Step 2: Install Fly CLI

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 3: Login
```bash
flyctl auth login
```

---

## Phase 2: Setup Database (Neon)

Same as Render guide:
1. Create Neon account: https://neon.tech
2. Create project: `college-publications`
3. Copy connection string:
   ```
   postgresql://user:pass@ep-xxx.neon.tech/publications?sslmode=require
   ```

---

## Phase 3: Setup Redis (Upstash)

Same as Render guide:
1. Create Upstash account: https://upstash.com
2. Create Redis database: `college-publications-redis`
3. Copy credentials:
   - REST URL: `https://xxx.upstash.io`
   - REST Token: `AxxxYYY...`

---

## Phase 4: Deploy Backend to Fly.io

### Step 1: Create Fly Configuration

**Create file:** `backend/fly.toml`

```toml
app = "college-publications-api"
primary_region = "iad"  # Change to closest region

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = false
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### Step 2: Create Dockerfile

**Create file:** `backend/Dockerfile`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
```

### Step 3: Update Backend Port

**Edit:** `backend/src/main.ts`

```typescript
const port = process.env.PORT || 8080;  // Change from 3000 to 8080
```

### Step 4: Deploy to Fly.io

```bash
cd backend

# Initialize (first time only)
flyctl launch --no-deploy

# Set secrets (environment variables)
flyctl secrets set DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/publications?sslmode=require"
flyctl secrets set REDIS_HOST="xxx.upstash.io"
flyctl secrets set REDIS_PORT="6379"
flyctl secrets set REDIS_PASSWORD="your-upstash-token"

# Deploy
flyctl deploy
```

### Step 5: Run Database Migrations

```bash
# SSH into Fly.io machine
flyctl ssh console

# Inside the machine:
cd /app
npx prisma db push
npx prisma db seed
exit
```

### Step 6: Get Backend URL

```bash
flyctl info
```

Copy your URL: `https://college-publications-api.fly.dev`

---

## Phase 5: Deploy Frontend to Vercel

Same as Render guide:

1. **Edit:** `frontend/.env.production`
   ```bash
   VITE_API_URL=https://college-publications-api.fly.dev/api
   ```

2. **Commit and push** to GitHub

3. **Deploy to Vercel:**
   - Import GitHub repo
   - Root: `frontend`
   - Framework: Vite
   - Add environment variable: `VITE_API_URL`

4. **Get frontend URL:** `https://your-app.vercel.app`

---

## Phase 6: Update CORS

### Set Frontend URL in Fly.io

```bash
flyctl secrets set FRONTEND_URL="https://your-app.vercel.app"
```

Backend will auto-restart with new environment variable.

---

## Phase 7: Import Faculty & Scrape

Same as Render guide:

```bash
# Update API URL in import script
# scripts/import-faculty-csv.js
const API_URL = 'https://college-publications-api.fly.dev/api';

# Import faculty
node scripts/import-faculty-csv.js

# Scrape publications
curl -X POST https://college-publications-api.fly.dev/api/jobs/scrape/all
```

---

## ✅ Success!

Your app is now deployed **100% FREE**:

- **Frontend:** https://your-app.vercel.app
- **Backend:** https://college-publications-api.fly.dev
- **Always-on:** No sleep delays!
- **Cost:** $0/month

---

## 🎯 Free Tier Limits

### Fly.io Free Tier Includes:
✅ Up to 3 shared-cpu-1x VMs (256MB RAM each)
✅ 3GB persistent volume storage
✅ 160GB outbound data transfer/month
✅ **Always-on** (no sleep!)

### Will This Be Enough?
For a college with:
- **10-50 faculty:** ✅ Plenty
- **50-100 faculty:** ✅ Should be fine
- **100-200 faculty:** ⚠️ May need to upgrade
- **200+ faculty:** ❌ Definitely need paid tier

---

## 📊 Performance Expectations

### Free Tier Performance:
```
Response Time:     500ms - 2s (acceptable)
Concurrent Users:  10-50 (good)
Uptime:           99%+ (reliable)
Cold Start:       None (always-on!)
```

### When to Upgrade:
- More than 100 faculty
- More than 1000 visitors/day
- Need faster response times (<500ms)
- Need more than 3 apps

**Upgrade Cost:** $1.94/month per VM

---

## 🔧 Fly.io CLI Commands

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# SSH into machine
flyctl ssh console

# Scale app (upgrade)
flyctl scale vm shared-cpu-1x --memory 512

# View secrets
flyctl secrets list

# Set secret
flyctl secrets set KEY=value

# Restart app
flyctl apps restart

# View pricing
flyctl pricing
```

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
flyctl logs

# Common issues:
- DATABASE_URL incorrect
- Prisma not generated
- Port mismatch (must be 8080)
```

### Database connection failed
```bash
# Verify DATABASE_URL has ?sslmode=require
flyctl secrets list | grep DATABASE_URL

# Update if needed
flyctl secrets set DATABASE_URL="correct-url"
```

### Out of memory
```bash
# Check current memory
flyctl status

# Free tier: 256MB RAM
# If needed, upgrade to 512MB:
flyctl scale vm shared-cpu-1x --memory 512
# Cost: $1.94/month
```

---

## 💡 Pro Tips

### 1. Monitor Usage
```bash
# Check free tier usage
flyctl dashboard
```

Stay under limits:
- 3 VMs
- 160GB transfer/month
- 3GB storage

### 2. Optimize for Free Tier
- Keep app small (<256MB memory)
- Minimize external API calls
- Use caching aggressively
- Optimize database queries

### 3. Scale Gradually
Start free, upgrade only when:
- Hitting memory limits
- Slow response times
- High traffic

### 4. Use Fly.io Regions
Choose closest region to users:
- `iad` - Washington, DC (US East)
- `lax` - Los Angeles (US West)
- `ams` - Amsterdam (Europe)
- `sin` - Singapore (Asia)

Edit `fly.toml` and change `primary_region`.

---

## 📈 Scaling Path

### Phase 1: Free ($0/month)
```
1x shared-cpu-1x VM (256MB)
✅ Good for 10-50 faculty
✅ 100-500 visitors/day
```

### Phase 2: Upgrade Memory ($1.94/month)
```
1x shared-cpu-1x VM (512MB)
✅ Good for 50-100 faculty
✅ 500-1000 visitors/day
```

### Phase 3: Add VM ($3.88/month)
```
2x shared-cpu-1x VM (512MB each)
✅ Good for 100-200 faculty
✅ 1000-5000 visitors/day
✅ High availability
```

### Phase 4: Dedicated CPU ($30+/month)
```
dedicated-cpu-1x or higher
✅ University-wide deployment
✅ 5000+ visitors/day
✅ Enterprise features
```

---

## 🎊 Comparison: Fly.io vs Render

| Feature | Fly.io FREE | Render FREE | Render PAID |
|---------|-------------|-------------|-------------|
| **Cost** | $0 | $0 | $7/mo |
| **Sleep** | ❌ No | ✅ 15min | ❌ No |
| **RAM** | 256MB | 512MB | 512MB |
| **Always-on** | ✅ Yes | ❌ No | ✅ Yes |
| **Cold start** | None | 30-60s | None |
| **Best for** | Production! | Testing | Production |

**Winner for FREE:** Fly.io ⭐

---

## 🎯 Final Recommendation

### **Use Fly.io FREE for:**
✅ Small to medium colleges (10-100 faculty)
✅ Always-on requirement
✅ Professional user experience
✅ $0 budget

### **Use Render PAID ($7/mo) for:**
✅ Easier setup (less technical)
✅ Better documentation
✅ Simpler dashboard
✅ Don't mind paying $7/month

### **Use Railway for:**
✅ Testing only
✅ Quick demos
✅ Not for production (sleep issues)

---

## ✅ Quick Start

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Deploy backend
cd backend
flyctl launch
flyctl secrets set DATABASE_URL="..."
flyctl deploy

# 4. Deploy frontend to Vercel
# (same as before)

# 5. Done! $0/month, always-on!
```

---

**Estimated Setup Time:** 45 minutes  
**Monthly Cost:** $0  
**Always-On:** Yes!  
**Professional:** Yes!

🚀 Best FREE option for your college publications portal!
