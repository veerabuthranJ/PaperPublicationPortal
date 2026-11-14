# Faculty Import Guide

## CSV Template Usage

The `faculty_template.csv` file now includes the **googleScholarId** column!

### CSV Format

```csv
firstName,lastName,email,orcidId,title,departmentCode,googleScholarId
```

### Column Descriptions

| Column | Required? | Example | Notes |
|--------|-----------|---------|-------|
| **firstName** | ✅ Yes | Sairamesh | First name of faculty |
| **lastName** | ✅ Yes | Lakshmanan | Last name of faculty |
| **email** | ✅ Yes | name@college.edu | Must be unique |
| **orcidId** | ❌ Optional | 0000-0003-0630-2571 | Leave empty if not available |
| **title** | ❌ Optional | Professor | Professor, Associate Professor, etc. |
| **departmentCode** | ✅ Yes | CSE | See department codes below |
| **googleScholarId** | ✅ **Recommended** | l9qipyYAAAAJ | From Scholar profile URL |

### Department Codes

- `CSE` = Computer Science and Engineering
- `EEE` = Electrical and Electronics Engineering
- `ECE` = Electronics and Communication Engineering
- `MECH` = Mechanical Engineering
- `CIVIL` = Civil Engineering
- `IT` = Information Technology
- `MATH` = Mathematics
- `PHY` = Physics
- `CHEM` = Chemistry
- `MGT` = Management Studies

---

## How to Get Google Scholar ID

### Example 1:
```
Full URL: https://scholar.google.com/citations?user=l9qipyYAAAAJ&hl=en

Google Scholar ID: l9qipyYAAAAJ
                   ^^^^^^^^^^^^^ (Copy this part only!)
```

### Example 2:
```
Full URL: https://scholar.google.com/citations?hl=en&user=abc123XYZ

Google Scholar ID: abc123XYZ
                   ^^^^^^^^^^ (Copy this part!)
```

**Rule:** Look for `user=` in the URL and copy everything after it until `&` or end of URL

---

## Example CSV Entries

### Example 1: Both ORCID and Google Scholar (BEST! ✅)
```csv
Sairamesh,Lakshmanan,sairamesh.ist@gmail.com,0000-0003-0630-2571,Professor,CSE,l9qipyYAAAAJ
```
**Result:** 142 publications with citations and DOIs

### Example 2: Only Google Scholar (Good ✅)
```csv
John,Smith,john.smith@college.edu,,Professor,EEE,abc123XYZ
```
**Note:** Empty ORCID (two commas: `,,`)
**Result:** All publications with citations (no DOIs)

### Example 3: Only ORCID (Partial ⚠️)
```csv
Mary,Johnson,mary.j@college.edu,0000-0001-2345-6789,Associate Professor,MECH,
```
**Note:** Empty Scholar ID (comma at end)
**Result:** Limited publications with DOIs (no citations)

### Example 4: Neither ID (Not Recommended ❌)
```csv
Raj,Kumar,raj.k@college.edu,,,Assistant Professor,IT,
```
**Note:** Both IDs empty
**Result:** No automatic scraping possible

---

## Complete Example CSV

```csv
firstName,lastName,email,orcidId,title,departmentCode,googleScholarId
Sairamesh,Lakshmanan,sairamesh.ist@gmail.com,0000-0003-0630-2571,Professor,CSE,l9qipyYAAAAJ
Rajesh,Gupta,rajesh.g@college.edu,0000-0001-2345-6789,Professor,EEE,abc123XYZ
Priya,Sharma,priya.s@college.edu,,Associate Professor,MECH,def456ABC
Amit,Patel,amit.p@college.edu,0000-0003-9876-5432,Assistant Professor,IT,
```

**This example shows:**
- Row 1: Both IDs (complete data)
- Row 2: Both IDs (complete data)  
- Row 3: Only Scholar ID (good coverage)
- Row 4: Only ORCID (partial coverage)

---

## How to Import

### Step 1: Edit CSV File
Edit `faculty_template.csv` with your faculty data

### Step 2: Run Import Script
```bash
cd c:\Users\veera\Downloads\Paperpublication
node scripts/import-faculty-csv.js
```

### Step 3: Trigger Scraping
After import completes, scrape all faculty publications:
```bash
curl -X POST http://localhost:3001/api/jobs/scrape/all
```

Or scrape individual faculty:
```bash
curl -X POST http://localhost:3001/api/jobs/scrape/faculty/{facultyId}
```

---

## Expected Output

```
🚀 Starting Faculty Import...

📄 Reading CSV file: faculty_template.csv

Found 4 faculty records

🔍 Fetching departments...
  CSE -> 50a2be3a-0401-4dad-bb5f-01360befcd4e
  EEE -> 04991d42-fc02-451a-8583-ff1a718452f1
  MECH -> f2b94984-a81e-466f-a329-660c98b2c798
  IT -> 0d072c73-4397-4beb-8680-87052913d3f8

📤 Importing faculty...

✅ Import Complete!

📊 Results:
   Total processed: 4
   ✅ Successfully imported: 4
   ❌ Failed: 0

✅ Successfully Imported:
   - Sairamesh Lakshmanan (sairamesh.ist@gmail.com) [ORCID: 0000-0003-0630-2571, Scholar: l9qipyYAAAAJ]
   - Rajesh Gupta (rajesh.g@college.edu) [ORCID: 0000-0001-2345-6789, Scholar: abc123XYZ]
   - Priya Sharma (priya.s@college.edu) [Scholar: def456ABC]
   - Amit Patel (amit.p@college.edu) [ORCID: 0000-0003-9876-5432]

🎉 Next Steps:
   1. Start scraping all faculty:
      curl -X POST http://localhost:3001/api/jobs/scrape/all

   2. Or scrape individually:
      curl -X POST http://localhost:3001/api/jobs/scrape/faculty/43ff7543-a2a5-481a-937c-ff78e530a099
```

---

## Verification

After scraping completes, verify on the website:

1. **Open:** http://localhost:5174
2. **Search** for faculty name
3. **View** their profile with all publications
4. **Check** publication counts and citation numbers

---

## Troubleshooting

### Issue: Import says "Failed" for a faculty
**Cause:** Duplicate email or missing department
**Solution:** Check CSV for typos, ensure department code exists

### Issue: No publications after import
**Cause:** Missing both ORCID and Scholar IDs
**Solution:** Add at least Google Scholar ID (recommended)

### Issue: Script says "backend server not running"
**Cause:** Backend not started
**Solution:** 
```bash
cd backend
npm run start:dev
```

### Issue: Google Scholar ID not working
**Cause:** Wrong ID format
**Solution:** Copy only the part after `user=` in the URL

---

## Best Practices

1. ✅ **Always include Google Scholar ID** - gives most complete data
2. ✅ **Add ORCID if available** - adds DOIs and structured metadata
3. ✅ **Use unique emails** - required for each faculty
4. ✅ **Test with 1-2 faculty first** - verify before bulk import
5. ✅ **Scrape after import** - publications won't appear until scraped

---

## Quick Reference

**Minimum Required:**
```csv
firstName,lastName,email,departmentCode,googleScholarId
John,Doe,john@college.edu,CSE,abc123
```

**Recommended (Complete):**
```csv
firstName,lastName,email,orcidId,title,departmentCode,googleScholarId
John,Doe,john@college.edu,0000-0001-2345-6789,Professor,CSE,abc123XYZ
```
