#!/bin/bash
# Automated Render Deployment Helper Script
# This script prepares and validates everything for Render deployment

set -e  # Exit on error

echo "🚀 College Publications - Render Deployment Helper"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Git installed"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js installed ($(node --version))"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Git repository detected"

# Step 2: Verify backend structure
echo ""
echo "📦 Step 2: Verifying backend structure..."
echo ""

if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend directory exists"

if [ ! -f "backend/package.json" ]; then
    echo -e "${RED}❌ Backend package.json not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Backend package.json exists"

if [ ! -f "backend/prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Prisma schema not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Prisma schema exists"

# Step 3: Create production environment template
echo ""
echo "📝 Step 3: Creating production environment template..."
echo ""

cat > backend/.env.production.template << 'EOF'
# Production Environment Variables for Render
# Copy these to Render Dashboard -> Environment tab

# ============================================
# DATABASE (Required)
# ============================================
# Get from: https://console.neon.tech
# 1. Create project
# 2. Copy connection string
# IMPORTANT: Must include ?sslmode=require
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/publications?sslmode=require

# ============================================
# REDIS (Required)
# ============================================
# Get from: https://console.upstash.com
# 1. Create Redis database
# 2. Copy connection details
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-redis-password

# ============================================
# APPLICATION (Required)
# ============================================
NODE_ENV=production
PORT=3000

# ============================================
# CORS (Update after frontend deployment)
# ============================================
FRONTEND_URL=https://your-app.vercel.app

# ============================================
# SECURITY (Recommended - Generate new values)
# ============================================
JWT_SECRET=CHANGE-THIS-TO-RANDOM-STRING-IN-PRODUCTION
JWT_EXPIRES_IN=7d

# ============================================
# OPTIONAL: External API Keys
# ============================================
IEEE_API_KEY=
SERPAPI_KEY=
SEMANTIC_SCHOLAR_API_KEY=

# ============================================
# OPTIONAL: Institution Settings
# ============================================
INSTITUTION_NAME=Your College Name
INSTITUTION_DOMAINS=college.edu
INSTITUTION_ALIASES=College Abbreviation
EOF

echo -e "${GREEN}✓${NC} Created backend/.env.production.template"

# Step 4: Verify render.yaml
echo ""
echo "🔧 Step 4: Verifying render.yaml configuration..."
echo ""

if [ ! -f "render.yaml" ]; then
    echo -e "${YELLOW}⚠${NC} render.yaml not found, creating one..."

    cat > render.yaml << 'EOF'
services:
  # Backend API Service
  - type: web
    name: college-publications-api
    runtime: node
    region: oregon
    plan: starter
    buildCommand: cd backend && npm install --include=dev && npx prisma generate && npm run build
    startCommand: cd backend && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        sync: false  # Set this in Render dashboard
      - key: REDIS_HOST
        sync: false  # Set this in Render dashboard
      - key: REDIS_PORT
        value: 6379
      - key: REDIS_PASSWORD
        sync: false  # Set this in Render dashboard
      - key: FRONTEND_URL
        sync: false  # Set this in Render dashboard after deploying frontend
    healthCheckPath: /api/departments
EOF
    echo -e "${GREEN}✓${NC} Created render.yaml"
else
    echo -e "${GREEN}✓${NC} render.yaml exists"
fi

# Step 5: Test build locally
echo ""
echo "🏗️  Step 5: Testing build process..."
echo ""

cd backend

echo "Installing dependencies..."
npm install --include=dev > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Dependencies installed"

echo "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Prisma client generated"

echo "Building application..."
npm run build > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Application built successfully"

cd ..

# Step 6: Check git status
echo ""
echo "📊 Step 6: Checking git status..."
echo ""

if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠${NC} You have uncommitted changes:"
    git status -s
    echo ""
    read -p "Commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Prepare for Render deployment"
        echo -e "${GREEN}✓${NC} Changes committed"
    fi
else
    echo -e "${GREEN}✓${NC} Working tree clean"
fi

# Step 7: Check remote
echo ""
echo "🌐 Step 7: Checking git remote..."
echo ""

if git remote get-url origin > /dev/null 2>&1; then
    REMOTE_URL=$(git remote get-url origin)
    echo -e "${GREEN}✓${NC} Git remote configured: $REMOTE_URL"
else
    echo -e "${RED}❌ No git remote configured${NC}"
    echo "Add a remote with: git remote add origin <your-github-repo-url>"
    exit 1
fi

# Step 8: Generate deployment checklist
echo ""
echo "📋 Step 8: Generating deployment checklist..."
echo ""

cat > RENDER_DEPLOYMENT_STEPS.md << 'EOF'
# Render Deployment Checklist

## ✅ Automated Setup Complete!

Your project is ready for Render deployment. Follow these manual steps:

---

## 🗄️ STEP 1: Setup Database (5 minutes)

### Option A: Neon (Recommended - Free tier)

1. Go to: https://console.neon.tech
2. Click "Create a project"
3. Settings:
   - Project name: `college-publications`
   - Database name: `publications`
   - Region: Choose closest to your users
4. Click "Create project"
5. **COPY the connection string shown** (includes `?sslmode=require`)
6. Save it - you'll need it for Render!

Example:
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/publications?sslmode=require
```

---

## 🔴 STEP 2: Setup Redis (3 minutes)

### Upstash (Recommended - Free tier)

1. Go to: https://console.upstash.com
2. Click "Create database"
3. Settings:
   - Name: `college-publications-redis`
   - Region: Same as your database region
   - Type: Regional (cheaper)
4. Click "Create"
5. **COPY these values:**
   - Host (without https://)
   - Port (usually 6379)
   - Password
6. Save them for Render!

---

## 🚀 STEP 3: Deploy to Render (10 minutes)

### 3.1: Push to GitHub (if not done)

```bash
git push origin master
```

### 3.2: Create Render Service

1. Go to: https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select your repository
5. Render will detect `render.yaml` automatically

### 3.3: Configure Service

**If using Blueprint (render.yaml detected):**
- Click "Apply Blueprint"
- Skip to Step 3.4

**If configuring manually:**
- Name: `college-publications-api`
- Region: Oregon (or closest)
- Branch: `master`
- Build Command: `cd backend && npm install --include=dev && npx prisma generate && npm run build`
- Start Command: `cd backend && npm run start:prod`
- Instance Type: **Starter ($7/month)**

### 3.4: Add Environment Variables

Click "Environment" tab and add:

```bash
NODE_ENV=production
PORT=3000

# From Step 1 (Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/publications?sslmode=require

# From Step 2 (Upstash)
REDIS_HOST=your-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Temporary (update after frontend deployment)
FRONTEND_URL=http://localhost:5174

# Optional: Generate random string for production
JWT_SECRET=your-random-secret-here-change-in-production
```

### 3.5: Deploy!

1. Click "Create Web Service" or "Save Changes"
2. Wait 5-10 minutes for build
3. **YOUR API URL:** `https://college-publications-api.onrender.com`

---

## 🗃️ STEP 4: Initialize Database (2 minutes)

Once deployment succeeds:

1. Go to Render Dashboard → Your service
2. Click "Shell" tab (top right)
3. Run these commands:

```bash
npx prisma db push
npx prisma db seed
```

4. Verify success:
```bash
curl https://your-backend-url.onrender.com/api/departments
```

Should return JSON with departments!

---

## ✅ STEP 5: Verify Deployment

Test these endpoints:

```bash
# Health check
curl https://your-backend-url.onrender.com/api/departments

# API docs
https://your-backend-url.onrender.com/api/docs

# Login test
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🌐 STEP 6: Deploy Frontend (Optional)

See `DEPLOYMENT_GUIDE.md` for Vercel deployment steps.

After frontend deployment:
1. Update `FRONTEND_URL` in Render environment variables
2. Add frontend URL to CORS in `backend/src/main.ts` if needed

---

## 🔒 STEP 7: Security Checklist

- [ ] Change default admin password (username: admin, password: admin123)
- [ ] Update JWT_SECRET to a random string
- [ ] Verify DATABASE_URL includes `?sslmode=require`
- [ ] Confirm CORS only allows your frontend domain
- [ ] Environment variables not committed to git
- [ ] Check render.yaml is committed to git

---

## 💰 Cost Summary

- Render Backend: $7/month (Starter plan)
- Neon Database: $0/month (free tier up to 500MB)
- Upstash Redis: $0/month (free tier up to 10K commands/day)

**Total: $7/month** 🎉

---

## 🆘 Troubleshooting

### Build fails on Render
- Check build logs in Render dashboard
- Verify `buildCommand` includes `cd backend`
- Ensure `package.json` has all dependencies

### Database connection error
- Verify DATABASE_URL is correct
- Ensure `?sslmode=require` is in URL
- Check Neon database is active

### Redis connection error
- Verify Redis credentials in Render environment
- Check Upstash dashboard for correct values
- Ensure REDIS_PORT is 6379

### "Cannot find module" error
- Verify devDependencies are installed: `npm install --include=dev`
- Check `buildCommand` includes `npx prisma generate`

---

## 📞 Need Help?

1. Check Render logs: Dashboard → Your service → Logs
2. Check Render docs: https://render.com/docs
3. Check this repo's DEPLOYMENT_GUIDE.md

---

## 🎉 Success!

Once deployed:
- Backend API: https://college-publications-api.onrender.com
- API Docs: https://college-publications-api.onrender.com/api/docs
- Test login: username=`admin`, password=`admin123`

**Next:** Deploy frontend to Vercel (see DEPLOYMENT_GUIDE.md)

Good luck! 🚀
EOF

echo -e "${GREEN}✓${NC} Created RENDER_DEPLOYMENT_STEPS.md"

# Final Summary
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Automated setup complete!${NC}"
echo "=================================================="
echo ""
echo "📁 Files created:"
echo "  • backend/.env.production.template"
echo "  • RENDER_DEPLOYMENT_STEPS.md"
echo "  • render.yaml (if missing)"
echo ""
echo "✅ Build test: PASSED"
echo "✅ Git repository: READY"
echo ""
echo "📋 Next steps (Manual):"
echo "  1. Create Neon database → Get DATABASE_URL"
echo "  2. Create Upstash Redis → Get Redis credentials"
echo "  3. Push to GitHub: git push origin master"
echo "  4. Deploy on Render.com"
echo "  5. Add environment variables"
echo "  6. Run: npx prisma db push && npx prisma db seed"
echo ""
echo "📖 Full instructions: Open RENDER_DEPLOYMENT_STEPS.md"
echo ""
echo -e "${YELLOW}⚠️  Manual steps required:${NC}"
echo "  - Creating accounts (Render, Neon, Upstash)"
echo "  - Configuring environment variables"
echo "  - Clicking deploy in Render dashboard"
echo ""
echo "🚀 Ready to deploy!"
