import { apiClient } from './apiClient';
import { Field } from '../../types/agro';

export const fieldService = {
  async getFields(farmId?: string): Promise<Field[]> {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : '';
    return apiClient.get<Field[]>(`/fields${query}`);
  },

  async getField(id: string): Promise<Field> {
    return apiClient.get<Field>(`/fields/${id}`);
  },

  async createField(data: Partial<Field>): Promise<Field> {
    return apiClient.post<Field>('/fields', data);
  },

  async updateField(id: string, data: Partial<Field>): Promise<Field> {
    return apiClient.patch<Field>(`/fields/${id}`, data);
  },

  async deleteField(id: string): Promise<{ success: boolean; id: string }> {
    return apiClient.delete<{ success: boolean; id: string }>(`/fields/${id}`);
  }
};
