import { api } from './api';

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export const departmentsService = {
  async getAll(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data;
  },

  async getById(id: string): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },
};
