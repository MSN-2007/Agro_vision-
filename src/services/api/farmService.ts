import { apiClient } from './apiClient';
import { Farm } from '../../types/agro';

export const farmService = {
  async getFarms(): Promise<Farm[]> {
    return apiClient.get<Farm[]>('/farms');
  },

  async createFarm(data: Partial<Farm>): Promise<Farm> {
    return apiClient.post<Farm>('/farms', data);
  },

  async updateFarm(id: string, data: Partial<Farm>): Promise<Farm> {
    return apiClient.put<Farm>(`/farms/${id}`, data);
  }
};
