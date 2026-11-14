import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facultyService, Faculty } from '../services/faculty.service';
import { publicationsService, SearchParams } from '../services/publications.service';
import { departmentsService } from '../services/departments.service';
import { Search, User, BookOpen, Building2 } from 'lucide-react';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'faculty' | 'publications'>('faculty');
  const [yearFrom, setYearFrom] = useState<string>('');
  const [yearTo, setYearTo] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Auto-search when filters change
  useEffect(() => {
    setActiveSearchQuery(searchQuery);
  }, [selectedDepartment, searchType]);

  const { data: faculty, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: facultyService.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsService.getAll,
  });

  const { data: publications, isLoading: publicationsLoading } = useQuery({
    queryKey: ['publications', activeSearchQuery, yearFrom, yearTo, selectedDepartment],
    queryFn: () => {
      const params: SearchParams = {
        query: activeSearchQuery || undefined,
        yearFrom: yearFrom ? parseInt(yearFrom) : undefined,
        yearTo: yearTo ? parseInt(yearTo) : undefined,
        departmentId: selectedDepartment || undefined,
        limit: 50,
      };
      return publicationsService.search(params);
    },
    enabled: searchType === 'publications',
  });

  const filteredFaculty = faculty?.filter((f) => {
    const fullName = `${f.firstName} ${f.lastName}`.toLowerCase();
    const matchesSearch = activeSearchQuery
      ? fullName.includes(activeSearchQuery.toLowerCase())
      : true;
    const matchesDept = selectedDepartment
      ? f.department?.id === selectedDepartment
      : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-blue-600">
            College Publications Portal
          </h1>
          <p className="text-gray-600 mt-2">
            Search research publications by faculty members
          </p>
        </div>
      </header>

      {/* Search Section */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Search Type Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSearchType('faculty')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                searchType === 'faculty'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="inline mr-2 h-5 w-5" />
              Search Faculty
            </button>
            <button
              onClick={() => setSearchType('publications')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                searchType === 'publications'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="inline mr-2 h-5 w-5" />
              Search Publications
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchType === 'faculty'
                  ? 'Search by faculty name...'
                  : 'Search publications by keyword...'
              }
              className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="inline h-4 w-4 mr-1" />
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Year From Filter */}
            {searchType === 'publications' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year From
                  </label>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year To
                  </label>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder={new Date().getFullYear().toString()}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          {searchType === 'faculty' ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {filteredFaculty?.length || 0} Faculty Members
              </h2>

              {facultyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading faculty...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredFaculty?.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => navigate(`/faculty/${f.id}`)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {f.title && `${f.title} `}
                            {f.firstName} {f.lastName}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {f.department?.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {f.email}
                          </p>
                          {f.orcidId && (
                            <p className="text-sm text-blue-600 mt-2">
                              ORCID: {f.orcidId}
                            </p>
                          )}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View Profile →
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredFaculty?.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No faculty members found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {publications?.meta.total || 0} Publications
              </h2>

              {publicationsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading publications...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {publications?.data.map((pub) => (
                    <div
                      key={pub.id}
                      onClick={() => navigate(`/publication/${pub.id}`)}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {pub.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {pub.authors.map((a) => a.author.name).join(', ')}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>{pub.publicationYear}</span>
                        {pub.venueName && <span>• {pub.venueName}</span>}
                        {pub.citationCount > 0 && (
                          <span>• {pub.citationCount} citations</span>
                        )}
                        <span className="text-blue-600">
                          Source: {pub.source.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      {pub.doi && (
                        <p className="text-xs text-gray-400 mt-2">
                          DOI: {pub.doi}
                        </p>
                      )}
                    </div>
                  ))}

                  {publications?.data.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No publications found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
