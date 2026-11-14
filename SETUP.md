# Setup Guide

## Phase 1: Foundation - COMPLETED ✅

The project foundation is now ready! Here's what has been set up:

### ✅ Completed

1. **Project Structure**
   - Backend (NestJS) and Frontend (React) directories
   - Docker Compose for PostgreSQL and Redis
   - Documentation and scripts folders

2. **Backend Setup**
   - NestJS framework with TypeScript
   - Prisma ORM with comprehensive database schema
   - Departments API module with CRUD operations
   - Swagger API documentation
   - Environment configuration

3. **Database Schema**
   - Departments, Faculty, Publications, Authors
   - Keywords, Publication relationships
   - Scraping jobs tracking
   - Full-text search support

4. **Frontend Setup**
   - Vite + React 18 + TypeScript
   - Tailwind CSS with shadcn/ui design system
   - React Query for data fetching
   - Toast notifications

## Getting Started

### Prerequisites

Ensure you have installed:
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Docker Desktop** (for Windows)
- **Git**

### Step 1: Start Infrastructure

```bash
# From the project root
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### Step 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Edit .env and configure:
# - DATABASE_URL (already set for local development)
# - IEEE_API_KEY (get from https://developer.ieee.org)
# - INSTITUTION_NAME and INSTITUTION_DOMAINS

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (departments)
npm run prisma:seed

# Start the development server
npm run start:dev
```

Backend will be available at:
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

### Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## Verify Installation

1. **Check Database**
   ```bash
   cd backend
   npm run prisma:studio
   ```
   This opens Prisma Studio to view your database.

2. **Test API**
   Open http://localhost:3000/api/docs in your browser.
   Try the `GET /api/departments` endpoint - you should see 10 departments.

3. **View Frontend**
   Open http://localhost:5173 in your browser.
   You should see the College Publications Portal homepage.

## What's Next?

### Phase 2: Data Collection (Next Steps)

Now that the foundation is ready, the next phase involves:

1. **Web Scraper Modules**
   - IEEE Xplore API integration
   - Semantic Scholar API integration
   - Google Scholar (via SerpAPI)

2. **Background Job Queue**
   - Bull Queue for async scraping
   - Rate limiting
   - Institution filtering

3. **Admin Dashboard**
   - Monitor scraping jobs
   - Add faculty manually
   - Verify publications

### Adding Your First Faculty Member

You can add a faculty member through Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

1. Go to the `Faculty` table
2. Click "Add record"
3. Fill in:
   - firstName, lastName, email
   - departmentId (select from departments)
   - googleScholarId, orcidId (if available)
   - title (e.g., "Professor")
   - isActive: true

## Troubleshooting

### Database Connection Issues

If you see "Can't reach database server":
1. Check Docker is running: `docker ps`
2. Verify PostgreSQL container: `docker-compose logs postgres`
3. Ensure DATABASE_URL in .env matches docker-compose.yml

### Port Already in Use

If ports 3000, 5173, 5432, or 6379 are in use:
1. Stop conflicting services
2. Or modify ports in:
   - docker-compose.yml (PostgreSQL, Redis)
   - backend/.env (PORT)
   - frontend/vite.config.ts (server.port)

### Prisma Migration Errors

If migrations fail:
```bash
# Reset database (WARNING: deletes all data)
cd backend
npm run prisma:migrate reset

# Then run seed again
npm run prisma:seed
```

## Development Workflow

1. **Backend changes**: Server auto-restarts (watch mode)
2. **Frontend changes**: Hot module reload (instant updates)
3. **Database changes**:
   ```bash
   # Edit prisma/schema.prisma
   npm run prisma:migrate dev --name description_of_change
   npm run prisma:generate
   ```

## Available Scripts

### Backend
- `npm run start:dev` - Start with hot reload
- `npm run prisma:studio` - Open database GUI
- `npm run prisma:migrate` - Run migrations
- `npm run lint` - Lint code
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Project Structure

```
paperpublication/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Seed data
│   └── src/
│       ├── main.ts            # Application entry
│       ├── app.module.ts      # Root module
│       ├── database/          # Prisma service
│       └── modules/
│           └── departments/   # Departments API
│
├── frontend/
│   └── src/
│       ├── main.tsx           # Application entry
│       ├── App.tsx            # Root component
│       └── index.css          # Global styles
│
├── docker-compose.yml         # Infrastructure
└── README.md                  # Project overview
```

## Need Help?

- Backend API docs: http://localhost:3000/api/docs
- Prisma docs: https://www.prisma.io/docs
- NestJS docs: https://docs.nestjs.com
- React docs: https://react.dev
- Tailwind docs: https://tailwindcss.com

---

🎉 **Congratulations!** Your development environment is ready. You can now proceed with Phase 2 to add web scraping functionality.
