import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facultyService } from '../services/faculty.service';
import {
  publicationsService,
  type Publication,
} from '../services/publications.service';
import { ArrowLeft, Mail, BookOpen, TrendingUp, Calendar } from 'lucide-react';

export function FacultyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: faculty, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty', id],
    queryFn: () => facultyService.getById(id!),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['faculty-stats', id],
    queryFn: () => facultyService.getStats(id!),
    enabled: !!id,
  });

  const { data: publications, isLoading: publicationsLoading } = useQuery({
    queryKey: ['publications', 'faculty', id],
    queryFn: () => publicationsService.search({ facultyId: id, limit: 500 }),
    enabled: !!id,
  });

  const uniquePublications = useMemo(() => {
    const byTitleAndYear = new Map<string, Publication>();
    for (const publication of publications?.data ?? []) {
      const normalizedTitle = publication.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const key = `${normalizedTitle}:${publication.publicationYear}`;
      const existing = byTitleAndYear.get(key);

      if (!existing || publication.citationCount > existing.citationCount) {
        byTitleAndYear.set(key, publication);
      }
    }

    return Array.from(byTitleAndYear.values());
  }, [publications?.data]);

  if (facultyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faculty profile...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Faculty member not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Search
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Faculty Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {faculty.title && `${faculty.title} `}
                {faculty.firstName} {faculty.lastName}
              </h2>
              <p className="text-xl text-gray-600 mt-2">
                {faculty.department?.name}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <a
                  href={`mailto:${faculty.email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {faculty.email}
                </a>
              </div>
              {faculty.orcidId && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">ORCID:</span>{' '}
                  <a
                    href={`https://orcid.org/${faculty.orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {faculty.orcidId}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Publications</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats.totalPublications}
                  </p>
                </div>
                <BookOpen className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Citations</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats.totalCitations}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Years Active</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {stats.publicationsByYear?.[stats.publicationsByYear.length - 1]?.year || ''} -{' '}
                    {stats.publicationsByYear?.[0]?.year || ''}
                  </p>
                </div>
                <Calendar className="h-12 w-12 text-purple-200" />
              </div>
            </div>
          </div>
        )}

        {/* Publications List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Publications ({stats?.totalPublications ?? uniquePublications.length})
          </h3>

          {publicationsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading publications...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uniquePublications.map((pub) => (
                <div
                  key={pub.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {pub.title}
                  </h4>

                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Authors:</span>{' '}
                    {pub.authors.map((a) => a.author.name).join(', ')}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {pub.publicationYear}
                    </span>
                    {pub.venueName && (
                      <span>
                        {pub.venueType === 'journal' ? '📄' : '📑'} {pub.venueName}
                      </span>
                    )}
                    {pub.citationCount > 0 && (
                      <span className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {pub.citationCount} citations
                      </span>
                    )}
                  </div>

                  {pub.doi && (
                    <div className="mt-2">
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        DOI: {pub.doi} →
                      </a>
                    </div>
                  )}

                  {pub.externalUrl && (
                    <div className="mt-2">
                      <a
                        href={pub.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Publication →
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {uniquePublications.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No publications found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
