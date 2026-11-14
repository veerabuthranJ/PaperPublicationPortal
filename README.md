# College Academic Publication Portal

A centralized platform for showcasing research publications by faculty members at your institution.

## Features

- 🔍 Search publications by faculty name
- 🏛️ Filter by department, year, and keywords
- 👨‍🏫 Faculty profile pages with complete publication lists
- 📊 Analytics dashboard with citation counts and publication trends
- 📥 Export citations in multiple formats (BibTeX, CSV, RIS)
- 🤖 Automated publication discovery via ORCID, Google Scholar, IEEE Xplore, and Semantic Scholar
- 🔄 Automatic deduplication across multiple sources
- 📈 Citation tracking and h-index calculation

## Tech Stack

**Frontend:**
- React 18 with Vite
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query for data fetching
- Zustand for state management

**Backend:**
- Node.js with NestJS
- PostgreSQL with Prisma ORM
- Redis for caching
- Bull Queue for background jobs

## Project Structure

```
paperpublication/
├── backend/          # NestJS API server
├── frontend/         # React application
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- Docker >= 20.x
- Docker Compose >= 2.x

### Installation

1. Clone the repository
2. Start infrastructure services:
   ```bash
   docker-compose up -d
   ```

3. Setup backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npx prisma migrate dev
   npx prisma db seed
   npm run start:dev
   ```

4. Setup frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Development URLs

- Frontend: http://localhost:5174
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs
- Database (Prisma Studio): Run `npx prisma studio` in backend directory

### Adding Faculty Members

1. Edit `faculty_template.csv` with faculty details (firstName, lastName, email, orcidId, title, departmentCode, googleScholarId)
2. Run import script: `node scripts/import-faculty-csv.js`
3. Scrape publications: `curl -X POST http://localhost:3001/api/jobs/scrape/all`

For detailed instructions, see [FACULTY_IMPORT_GUIDE.md](FACULTY_IMPORT_GUIDE.md)

### Updating Publications

To fetch new publications for existing faculty:
```bash
curl -X POST http://localhost:3001/api/jobs/scrape/all
```

Run this monthly or weekly to keep publications up-to-date.

## License

MIT
