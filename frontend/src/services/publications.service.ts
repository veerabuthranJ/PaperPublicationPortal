import { api } from './api';

export interface Publication {
  id: string;
  title: string;
  abstract?: string;
  publicationYear: number;
  publicationDate?: string;
  venueType?: string;
  venueName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pdfUrl?: string;
  externalUrl?: string;
  citationCount: number;
  source: string;
  authors: {
    id: string;
    authorPosition: number;
    author: {
      name: string;
      faculty?: {
        id: string;
        firstName: string;
        lastName: string;
        department?: {
          name: string;
        };
      };
    };
  }[];
  keywords?: {
    keyword: {
      keyword: string;
    };
  }[];
}

export interface SearchParams {
  query?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  departmentId?: string;
  facultyId?: string;
  keywords?: string[];
  source?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const publicationsService = {
  async search(params: SearchParams): Promise<PaginatedResponse<Publication>> {
    const response = await api.post('/publications/search', params);
    return response.data;
  },

  async getAll(page = 1, limit = 20): Promise<PaginatedResponse<Publication>> {
    const response = await api.get('/publications', {
      params: { page, limit },
    });
    return response.data;
  },

  async getById(id: string): Promise<Publication> {
    const response = await api.get(`/publications/${id}`);
    return response.data;
  },

  async getStatistics() {
    const response = await api.get('/publications/statistics');
    return response.data;
  },

  async exportBibTeX(ids: string[]): Promise<string> {
    const response = await api.post('/publications/export/bibtex', { ids });
    return response.data;
  },
};
