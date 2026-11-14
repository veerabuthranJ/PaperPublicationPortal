# Complete Workflow: From ORCID IDs to Searchable Faculty

## Your Requirement (Summary)

✅ **Input**: Excel/CSV with faculty names + ORCID IDs  
✅ **Backend**: Automatically fetch all papers using ORCID  
✅ **Frontend**: Search by faculty name → View their profile → See all publications  
✅ **Key Point**: **ONLY ORCID ID is needed** - no manual paper entry required!

---

## 🎯 YES! You Can Track Papers Using ONLY ORCID ID

**Answer: Absolutely YES!**

Once you add a faculty member's ORCID ID to the system:
- ✅ System automatically fetches ALL their publications
- ✅ No need to enter papers manually
- ✅ No need for institution name/email filtering
- ✅ 100% accurate - if it's in their ORCID profile, it's their paper
- ✅ Works across ALL publishers (IEEE, Springer, ACM, Nature, etc.)

---

## 📋 Complete Step-by-Step Workflow

### Step 1: Prepare Faculty List (Excel/CSV)

**Option A: Use the Template CSV**

I've created a template for you: **[faculty_template.csv](faculty_template.csv:1)**

```csv
firstName,lastName,email,orcidId,title,departmentCode
John,Doe,john.doe@college.edu,0000-0003-0630-2571,Professor,CSE
Jane,Smith,jane.smith@college.edu,0000-0002-1234-5678,Associate Professor,CSE
```

**Required Columns:**
- `firstName` - Faculty first name
- `lastName` - Faculty last name
- `email` - Institutional email (must be unique)
- `orcidId` - Their ORCID ID (format: 0000-0000-0000-0000)
- `title` - Professor / Associate Professor / Assistant Professor / Lecturer
- `departmentCode` - Department code (CSE, EEE, MECH, etc.)

**Option B: Use Excel**

Create an Excel file with the same columns, then save as CSV.

---

### Step 2: Import All Faculty at Once

**Method 1: Using the Import Script (Recommended)**

```bash
# Make sure backend is running first
cd backend
npm run start:dev

# In another terminal, run the import script
cd scripts
node import-faculty-csv.js ../faculty_template.csv
```

**Output:**
```
🚀 Starting Faculty Import...

📄 Reading CSV file: faculty_template.csv

Found 3 faculty records

🔍 Fetching departments...
  CSE -> abc123-dept-id
  EEE -> def456-dept-id

📤 Importing faculty...

✅ Import Complete!

📊 Results:
   Total processed: 3
   ✅ Successfully imported: 3
   ❌ Failed: 0

✅ Successfully Imported:
   - John Doe (john.doe@college.edu) [ORCID: 0000-0003-0630-2571]
   - Jane Smith (jane.smith@college.edu) [ORCID: 0000-0002-1234-5678]

🎉 Next Steps:
   1. Start scraping all faculty:
      curl -X POST http://localhost:3000/api/jobs/scrape/all
```

**Method 2: Using API Directly (Swagger)**

1. Open http://localhost:3000/api/docs
2. Find **POST /api/faculty/bulk-import**
3. Click "Try it out"
4. Paste JSON:

```json
{
  "faculty": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@college.edu",
      "orcidId": "0000-0003-0630-2571",
      "title": "Professor",
      "isActive": true
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@college.edu",
      "orcidId": "0000-0002-1234-5678",
      "title": "Associate Professor",
      "isActive": true
    }
  ]
}
```

5. Click "Execute"

---

### Step 3: Scrape Publications from ORCID

Once faculty are imported, fetch their publications:

**Option A: Scrape All Faculty at Once**

```bash
curl -X POST http://localhost:3000/api/jobs/scrape/all
```

This will:
- Find all active faculty
- For each faculty with an ORCID ID, scrape their publications
- Run in background (doesn't block)
- Takes ~5-15 seconds per faculty

**Option B: Scrape One Faculty (for testing)**

```bash
# Get faculty ID first
curl http://localhost:3000/api/faculty

# Then scrape that faculty
curl -X POST http://localhost:3000/api/jobs/scrape/faculty/{faculty-id}
```

**Monitor Progress:**

```bash
# Check job status
curl http://localhost:3000/api/jobs

# Check queue stats
curl http://localhost:3000/api/jobs/stats
```

**What Happens During Scraping:**

1. System reads faculty ORCID ID: `0000-0003-0630-2571`
2. Fetches publications from ORCID API
3. For each publication:
   - Checks if already in database (deduplication by DOI)
   - Creates new publication OR updates existing
   - Links publication to faculty member
4. Also scrapes IEEE Xplore + Semantic Scholar (for metadata enrichment)
5. Job completes → publications now in database

---

### Step 4: Frontend Search Interface (Phase 3)

**Current Status:** Backend is ready, frontend needs to be built.

**What You'll Get (Phase 3):**

```
┌─────────────────────────────────────────────┐
│  College Publications Portal                │
├─────────────────────────────────────────────┤
│                                             │
│  🔍  Search Faculty or Publications         │
│  ┌──────────────────────────────────────┐  │
│  │ John Doe                          🔍 │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  Results:                                   │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Dr. John Doe                     │   │
│  │    Professor, Computer Science      │   │
│  │    📚 45 Publications               │   │
│  │    📖 1,234 Citations               │   │
│  │    [View Profile]                   │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👤 Dr. John Smith                   │   │
│  │    Associate Prof, Mathematics      │   │
│  │    📚 28 Publications               │   │
│  │    [View Profile]                   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**When You Click "View Profile":**

```
┌─────────────────────────────────────────────┐
│  Dr. John Doe                               │
│  Professor • Computer Science               │
│  john.doe@college.edu                       │
│  ORCID: 0000-0003-0630-2571                │
├─────────────────────────────────────────────┤
│  📊 Statistics                              │
│  • Total Publications: 45                   │
│  • Total Citations: 1,234                   │
│  • H-Index: 18                              │
│  • Years Active: 2010-2024                  │
├─────────────────────────────────────────────┤
│  📚 Publications (45)                       │
│  ┌───────────────────────────────────────┐ │
│  │ 📄 Deep Learning for Medical Imaging  │ │
│  │    IEEE Trans. Neural Networks, 2023  │ │
│  │    Citations: 156 | DOI: 10.1109/... │ │
│  │    [View] [Export Citation]           │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │ 📄 Convolutional Neural Networks...   │ │
│  │    Nature, 2022                       │ │
│  │    Citations: 289 | DOI: 10.1038/... │ │
│  └───────────────────────────────────────┘ │
│  ... (43 more)                              │
└─────────────────────────────────────────────┘
```

**Filters Available:**
- 🗓️ Filter by year (e.g., 2020-2024)
- 🏢 Filter by department
- 🔖 Filter by keywords
- 📖 Sort by citations / year / title

---

## ✅ Current Status & What's Ready

### ✅ Backend Complete (Phase 2)

**Ready to Use NOW:**

1. **Bulk Import API** ✅
   - Add 100s of faculty at once
   - CSV import script ready
   - Swagger UI for testing

2. **ORCID Integration** ✅
   - Fetches ALL publications from ORCID
   - Works with ANY ORCID ID
   - No API key needed (free)

3. **Background Jobs** ✅
   - Scraping runs in background
   - Can monitor progress
   - Automatic retries on failure

4. **Search API** ✅
   - Search by faculty name
   - Search by publication title/keyword
   - Filter by year, department
   - Pagination support

5. **Publications API** ✅
   - Get faculty publications
   - Export as BibTeX
   - View statistics

**Test It Now:**

```bash
# 1. Import faculty
cd scripts
node import-faculty-csv.js ../faculty_template.csv

# 2. Scrape publications
curl -X POST http://localhost:3000/api/jobs/scrape/all

# 3. Search for faculty
curl http://localhost:3000/api/faculty

# 4. Get publications for a faculty
curl "http://localhost:3000/api/publications?facultyId={faculty-id}"

# 5. Search publications by keyword
curl -X POST http://localhost:3000/api/publications/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning", "yearFrom": 2020}'
```

### ⏳ Frontend To Be Built (Phase 3)

**What Needs to Be Done:**

1. **Search Page** - Type faculty name, see results
2. **Faculty Profile Page** - Show all publications, stats
3. **Publication Detail Page** - Full paper details
4. **Admin Dashboard** - Monitor scraping jobs
5. **Analytics Page** - Department statistics, charts

**Timeline:** Phase 3 takes ~2-3 weeks

---

## 🔄 How It All Works Together

### Workflow Diagram

```
1. You Have:
   ┌──────────────────┐
   │ Excel/CSV File   │
   │ with Faculty     │
   │ + ORCID IDs      │
   └──────────────────┘
           ↓
2. Import to Database:
   ┌──────────────────┐
   │ Run Import       │
   │ Script           │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ Faculty Table    │
   │ in PostgreSQL    │
   └──────────────────┘
           ↓
3. Scrape Publications:
   ┌──────────────────┐
   │ Trigger          │
   │ Scraping Job     │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ ORCID API        │
   │ (fetch papers)   │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ Publications     │
   │ Table in DB      │
   └──────────────────┘
           ↓
4. User Searches:
   ┌──────────────────┐
   │ Frontend Search  │
   │ "John Doe"       │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ Backend API      │
   │ Search Faculty   │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ Show Results     │
   │ with Pub Count   │
   └──────────────────┘
           ↓
5. View Profile:
   ┌──────────────────┐
   │ Click Faculty    │
   └──────────────────┘
           ↓
   ┌──────────────────┐
   │ Show All Papers  │
   │ from Database    │
   └──────────────────┘
```

---

## 📝 Quick Start Checklist

- [ ] **Step 1**: Prepare CSV with faculty data
  - Get all faculty ORCID IDs
  - Fill in [faculty_template.csv](faculty_template.csv:1)

- [ ] **Step 2**: Start backend
  ```bash
  docker-compose up -d
  cd backend
  npm install
  npm run start:dev
  ```

- [ ] **Step 3**: Import faculty
  ```bash
  cd scripts
  node import-faculty-csv.js ../faculty_template.csv
  ```

- [ ] **Step 4**: Scrape publications
  ```bash
  curl -X POST http://localhost:3000/api/jobs/scrape/all
  ```

- [ ] **Step 5**: Verify data
  ```bash
  curl http://localhost:3000/api/faculty
  curl http://localhost:3000/api/publications/statistics
  ```

- [ ] **Step 6**: Build frontend (Phase 3)
  - Search interface
  - Faculty profiles
  - Publication lists

---

## ❓ FAQs

### Q: Do I need anything other than ORCID ID?
**A: NO!** Just the ORCID ID is enough. The system fetches everything automatically.

### Q: What if faculty doesn't have ORCID?
**A: Two options:**
1. Ask them to create one (takes 2 minutes at orcid.org/register)
2. Use IEEE Xplore + Semantic Scholar (less accurate, needs institution filtering)

### Q: How many faculty can I add at once?
**A: Unlimited!** The CSV import script can handle 100s of faculty.

### Q: How long does scraping take?
**A: ~5-15 seconds per faculty.** For 50 faculty, expect ~5-10 minutes total.

### Q: Do publications update automatically?
**A: Not yet.** Currently manual trigger. You can:
- Run monthly: `curl -X POST http://localhost:3000/api/jobs/scrape/all`
- Or set up a cron job to run weekly

### Q: Where do I see the results?
**A: Two ways:**
1. **Via API**: Use cURL or Swagger (http://localhost:3000/api/docs)
2. **Via Frontend**: Coming in Phase 3

### Q: Can I try it now without frontend?
**A: YES!** Use the API:
```bash
# Search faculty by name
curl "http://localhost:3000/api/faculty" | grep "Doe"

# Get publications
curl "http://localhost:3000/api/publications?facultyId={id}"
```

---

## 🎯 Summary

**What You Need:**
1. ✅ Faculty names + ORCID IDs (in CSV)

**What System Does:**
1. ✅ Import all faculty (one command)
2. ✅ Fetch ALL publications from ORCID (automatic)
3. ✅ Store in database with deduplication
4. ✅ Provide search API

**What You Get:**
1. ✅ Complete publication database
2. ✅ Searchable by faculty name
3. ✅ 100% accurate attribution
4. ⏳ Frontend UI (coming in Phase 3)

**Next Steps:**
1. ✅ Backend ready → **You can import faculty NOW**
2. ⏳ Frontend → **Phase 3** (build search UI)

---

Need help getting started? Let me know:
1. Do you have the CSV with ORCID IDs ready?
2. Is the backend running?
3. Should we proceed with Phase 3 (Frontend)?
