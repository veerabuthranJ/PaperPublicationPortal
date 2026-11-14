# ORCID Integration Guide

## What is ORCID?

**ORCID (Open Researcher and Contributor ID)** is a persistent digital identifier that distinguishes researchers and their work. It's like a social security number for researchers - unique, persistent, and globally recognized.

**Example ORCID:** `0000-0002-1825-0097`

## Why Use ORCID for Paper Tracking?

### ✅ Advantages

1. **No Name Ambiguity**
   - "John Smith" could be 100 different people
   - But ORCID `0000-0001-2345-6789` is always ONE specific person

2. **Cross-Publisher Coverage**
   - Works across ALL publishers (IEEE, Springer, Elsevier, ACM, etc.)
   - Not limited to single database like IEEE Xplore

3. **Self-Maintained & Up-to-Date**
   - Researchers maintain their own profiles
   - Often more complete than institutional records

4. **No Institution Filtering Needed**
   - If it's in their ORCID profile, it's their paper
   - 100% accurate attribution

5. **Completely Free**
   - Public API, no API key required
   - No rate limits (20 requests/second)

6. **Works Across Career Changes**
   - Follows researcher even if they change:
     - Name (marriage, etc.)
     - Institution
     - Country
     - Email

### ⚠️ Limitations

1. **Requires ORCID ID**
   - Faculty must have registered for ORCID
   - Need to collect their ORCID IDs

2. **Depends on Profile Completeness**
   - Only finds papers the researcher added to their profile
   - Some researchers don't maintain their profiles

3. **Limited Metadata**
   - ORCID provides basic info (title, DOI, year)
   - Doesn't include abstracts or full author lists
   - Citations counts not available

**Recommendation:** Use ORCID as **primary source** when available, supplemented by IEEE/Semantic Scholar for metadata enrichment.

---

## How to Use ORCID in Your System

### Step 1: Get Faculty ORCID IDs

#### Option A: Search on ORCID.org

1. Go to https://orcid.org/orcid-search/search
2. Search for faculty member by name
3. Copy their ORCID ID (format: `0000-0001-2345-6789`)

#### Option B: Ask Faculty Members

Many researchers already know their ORCID:
- It's on their research papers
- It's in their email signatures
- It's on department websites

#### Option C: Bulk Import

If your institution uses ORCID:
- Check with your library/research office
- They may have a list of faculty ORCIDs

### Step 2: Add ORCID ID to Faculty Record

**Via API:**
```bash
curl -X POST http://localhost:3000/api/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@college.edu",
    "departmentId": "dept-uuid",
    "orcidId": "0000-0002-1825-0097",
    "title": "Professor"
  }'
```

**Or Update Existing:**
```bash
curl -X PATCH http://localhost:3000/api/faculty/{faculty-id} \
  -H "Content-Type: application/json" \
  -d '{
    "orcidId": "0000-0002-1825-0097"
  }'
```

**Via Prisma Studio:**
1. Run: `cd backend && npm run prisma:studio`
2. Open Faculty table
3. Edit record, add ORCID ID
4. Save

### Step 3: Scrape Publications

**Automatic (when ORCID ID present):**

When you scrape a faculty member who has an ORCID ID, the system will automatically use ORCID:

```bash
# This will use ORCID + IEEE + Semantic Scholar
POST /api/jobs/scrape/faculty/{faculty-id}
```

**ORCID Only:**

```bash
curl -X POST http://localhost:3000/api/jobs/scrape/faculty/{faculty-id} \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["orcid"]
  }'
```

**Check What Gets Scraped:**

```bash
# See which scrapers are available
GET /api/publications/statistics

# Response includes:
{
  "scrapers": {
    "orcid": {
      "available": true,
      "name": "orcid",
      "note": "Requires faculty to have ORCID ID"
    }
  }
}
```

---

## How ORCID Scraping Works

### Process Flow

1. **Fetch Works Summary**
   ```
   GET https://pub.orcid.org/v3.0/{orcid-id}/works
   ```
   Returns list of all publications in ORCID profile

2. **Fetch Each Work Detail**
   ```
   GET https://pub.orcid.org/v3.0/{orcid-id}/work/{put-code}
   ```
   Gets full metadata for each publication

3. **Parse & Store**
   - Extract: title, year, DOI, venue, type
   - Create publication record
   - Link to faculty member
   - **Skip institution filter** (trust ORCID profile)

4. **Deduplicate**
   - Check for existing publications by DOI
   - Merge if found, create if new
   - Keep best metadata from all sources

### What Gets Extracted

From ORCID API:
- ✅ Title
- ✅ Publication year
- ✅ DOI (if available)
- ✅ Venue/Journal name
- ✅ Publication type (journal/conference)
- ✅ External URL
- ✅ Contributors (authors)

Not available from ORCID:
- ❌ Abstract
- ❌ Citation count
- ❌ Full author affiliations
- ❌ Keywords

**Solution:** Combine ORCID with other sources:
1. ORCID gives you complete publication list
2. IEEE/Semantic Scholar enrich with abstracts, citations

---

## Example Workflow

### Scenario: Add New Faculty Member

```bash
# 1. Create faculty with ORCID
curl -X POST http://localhost:3000/api/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@college.edu",
    "departmentId": "cse-dept-id",
    "orcidId": "0000-0003-1234-5678",
    "title": "Associate Professor"
  }'

# Response: { "id": "faculty-uuid-123", ... }

# 2. Trigger scraping (will use ORCID automatically)
curl -X POST http://localhost:3000/api/jobs/scrape/faculty/faculty-uuid-123

# Response: {
#   "message": "Started 3 scraping jobs for faculty",
#   "jobs": [
#     { "source": "orcid", "jobId": "1", ... },
#     { "source": "ieee_xplore", "jobId": "2", ... },
#     { "source": "semantic_scholar", "jobId": "3", ... }
#   ]
# }

# 3. Monitor progress
curl http://localhost:3000/api/jobs

# 4. View faculty publications
curl http://localhost:3000/api/publications?facultyId=faculty-uuid-123

# Response: {
#   "data": [
#     {
#       "id": "pub-1",
#       "title": "Deep Learning for Medical Imaging",
#       "year": 2023,
#       "source": "orcid",
#       "doi": "10.1109/...",
#       ...
#     }
#   ]
# }
```

---

## Recommendations

### For Best Results:

1. **Prioritize ORCID Collection**
   - Get ORCID IDs from all faculty first
   - More reliable than name-based searching

2. **Use Multi-Source Strategy**
   ```
   ORCID (complete list) 
     + IEEE (abstracts, citations for IEEE papers)
     + Semantic Scholar (abstracts, citations for all papers)
     = Complete, accurate dataset
   ```

3. **Regular Updates**
   - Scrape ORCID monthly/quarterly
   - Researchers add new papers to their profiles
   - Automatic updates when they publish

4. **Encourage Faculty to Maintain ORCID**
   - Send email asking faculty to:
     - Register for ORCID if they don't have one
     - Add past publications to their profile
     - Keep it updated with new work

5. **Verify Data Quality**
   - Use admin dashboard to review scraped publications
   - Faculty can verify/claim publications
   - Mark as verified after review

---

## Troubleshooting

### Faculty Has ORCID But No Results

**Possible Reasons:**
1. Empty ORCID profile
   - Solution: Ask faculty to add publications to ORCID

2. Wrong ORCID ID
   - Solution: Verify ID format: `0000-0000-0000-0000`
   - Check on ORCID.org

3. Privacy settings
   - Solution: Works are private on ORCID
   - Ask faculty to make works public

### ORCID Scraper Not Running

**Check:**
```bash
GET /api/publications/statistics
```

Should show:
```json
{
  "scrapers": {
    "orcid": {
      "available": true,
      "name": "orcid"
    }
  }
}
```

If `available: false`, check backend logs.

### How to Test ORCID Integration

**Use a known ORCID with publications:**

Test with a well-known researcher:
- ORCID: `0000-0002-1825-0097` (has many publications)
- Create test faculty with this ORCID
- Run scraping
- Should return publications

---

## API Reference

### Get Faculty with Publications (including ORCID source)

```bash
GET /api/faculty/{faculty-id}
```

Response includes:
```json
{
  "id": "faculty-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "orcidId": "0000-0002-1825-0097",
  "authors": [
    {
      "publications": [
        {
          "publication": {
            "title": "Paper Title",
            "source": "orcid",
            "sourceId": "0000-0002-1825-0097:12345",
            ...
          }
        }
      ]
    }
  ]
}
```

### Filter by Source

```bash
POST /api/publications/search
{
  "source": "orcid",
  "facultyId": "faculty-uuid"
}
```

Returns only publications from ORCID.

---

## Benefits Summary

| Feature | Name Search | ORCID |
|---------|-------------|-------|
| Accuracy | ~70-80% | ~99% |
| Ambiguity | High (common names) | None (unique ID) |
| Cross-publisher | Limited | Complete |
| Setup time | None | Need to collect IDs |
| Maintenance | High (name changes) | Low (ID never changes) |
| Institution filter | Required | Not needed |
| API cost | Varies | Free |
| Coverage | Depends on source | Depends on profile |

**Verdict:** ORCID is the gold standard. Use it whenever possible, supplement with other sources for metadata enrichment.

---

## Getting Started Checklist

- [ ] Collect ORCID IDs from faculty (email/survey)
- [ ] Add ORCID IDs to faculty records
- [ ] Test scraping with one faculty member
- [ ] Review scraped publications for accuracy
- [ ] Run bulk scraping for all faculty with ORCIDs
- [ ] Set up monthly automated scraping
- [ ] Encourage faculty to maintain their ORCID profiles

---

**Need help getting faculty ORCID IDs?** 

Send this email template:

```
Subject: Request: Your ORCID iD for College Publications Portal

Dear [Faculty Name],

We're building a new publications portal to showcase research from our institution. To ensure accurate attribution of your work, we'd like to include your ORCID iD.

If you have an ORCID iD, please share it with us.
Format: 0000-0000-0000-0000

If you don't have an ORCID yet, you can register for free at:
https://orcid.org/register

Your ORCID will help us:
✓ Accurately track all your publications
✓ Avoid confusion with researchers who have similar names
✓ Automatically update your profile when you publish new work

Please reply with your ORCID iD or let us know if you need help registering.

Thank you!
[Your Name]
```

---

**Ready to use ORCID? Just add the ORCID ID when creating/updating faculty records and the system handles the rest!**
