const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const CSV_FILE = process.argv[2] || path.join(__dirname, '../faculty_template.csv');

// Department code mapping (update based on your seeded departments)
const DEPARTMENT_MAPPING = {
  'CSE': 'Computer Science and Engineering',
  'EEE': 'Electrical and Electronics Engineering',
  'MECH': 'Mechanical Engineering',
  'CIVIL': 'Civil Engineering',
  'ECE': 'Electronics and Communication Engineering',
  'IT': 'Information Technology',
  'MATH': 'Mathematics',
  'PHY': 'Physics',
  'CHEM': 'Chemistry',
  'MGT': 'Management Studies',
};

async function getDepartmentId(departmentCode) {
  try {
    const response = await fetch(`${API_URL}/api/departments`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const departments = await response.json();

    const deptName = DEPARTMENT_MAPPING[departmentCode];
    const dept = departments.find(d => d.name === deptName || d.code === departmentCode);

    return dept?.id;
  } catch (error) {
    console.error(`Error fetching departments: ${error.message}`);
    return null;
  }
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const faculty = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length !== headers.length) {
      console.warn(`Skipping malformed line ${i + 1}: ${lines[i]}`);
      continue;
    }

    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });

    faculty.push(record);
  }

  return faculty;
}

async function importFaculty() {
  console.log('🚀 Starting Faculty Import...\n');

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ Error: CSV file not found at ${CSV_FILE}`);
    console.log('\nUsage: node import-faculty-csv.js [path/to/faculty.csv]');
    console.log('If no path provided, uses faculty_template.csv in project root');
    process.exit(1);
  }

  console.log(`📄 Reading CSV file: ${CSV_FILE}\n`);

  // Read and parse CSV
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const facultyRecords = parseCSV(csvContent);

  console.log(`Found ${facultyRecords.length} faculty records\n`);

  // Fetch departments for mapping
  console.log('🔍 Fetching departments...');
  const departmentCache = {};

  const uniqueDeptCodes = [...new Set(facultyRecords.map(f => f.departmentCode))];
  for (const code of uniqueDeptCodes) {
    if (code) {
      const deptId = await getDepartmentId(code);
      departmentCache[code] = deptId;
      console.log(`  ${code} -> ${deptId || 'Not found'}`);
    }
  }

  console.log('\n📤 Importing faculty...\n');

  // Transform to API format
  const facultyData = facultyRecords.map(record => ({
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    orcidId: record.orcidId || undefined,
    googleScholarId: record.googleScholarId || undefined,
    title: record.title,
    departmentId: departmentCache[record.departmentCode] || undefined,
    isActive: true,
  }));

  // Import via API
  try {
    const response = await fetch(`${API_URL}/api/faculty/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        faculty: facultyData,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Import Complete!\n');
    console.log(`📊 Results:`);
    console.log(`   Total processed: ${result.total}`);
    console.log(`   ✅ Successfully imported: ${result.success.length}`);
    console.log(`   ❌ Failed: ${result.failed.length}\n`);

    if (result.success.length > 0) {
      console.log('✅ Successfully Imported:');
      result.success.forEach(faculty => {
        const ids = [];
        if (faculty.orcidId) ids.push(`ORCID: ${faculty.orcidId}`);
        if (faculty.googleScholarId) ids.push(`Scholar: ${faculty.googleScholarId}`);
        const idsStr = ids.length > 0 ? ` [${ids.join(', ')}]` : '';
        console.log(`   - ${faculty.firstName} ${faculty.lastName} (${faculty.email})${idsStr}`);
      });
      console.log();
    }

    if (result.failed.length > 0) {
      console.log('❌ Failed Imports:');
      result.failed.forEach(fail => {
        console.log(`   - ${fail.data.firstName} ${fail.data.lastName}: ${fail.error}`);
      });
      console.log();
    }

    // Suggest next step
    if (result.success.length > 0) {
      console.log('🎉 Next Steps:');
      console.log('   1. Start scraping all faculty:');
      console.log(`      curl -X POST ${API_URL}/api/jobs/scrape/all\n`);
      console.log('   2. Or scrape individually:');
      result.success.slice(0, 1).forEach(faculty => {
        console.log(`      curl -X POST ${API_URL}/api/jobs/scrape/faculty/${faculty.id}`);
      });
      console.log();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n⚠️  Make sure the backend server is running at', API_URL);
    console.error('   Start it with: cd backend && npm run start:dev');
    process.exit(1);
  }
}

// Run import
importFaculty().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
