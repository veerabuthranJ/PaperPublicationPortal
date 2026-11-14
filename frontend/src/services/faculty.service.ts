import { api } from './api';

export interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  orcidId?: string;
  profileImageUrl?: string;
  bio?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export const facultyService = {
  async getAll(): Promise<Faculty[]> {
    const response = await api.get('/faculty');
    return response.data;
  },

  async getById(id: string): Promise<Faculty> {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },

  async getByDepartment(departmentId: string): Promise<Faculty[]> {
    const response = await api.get(`/faculty/department/${departmentId}`);
    return response.data;
  },

  async getStats(id: string) {
    const response = await api.get(`/faculty/${id}/stats`);
    return response.data;
  },
};
