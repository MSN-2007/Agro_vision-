import { apiClient } from './apiClient';
import { Observation } from '../../types/agro';

export const observationService = {
  async getObservations(params?: { fieldId?: string; farmId?: string }): Promise<Observation[]> {
    const searchParams = new URLSearchParams();
    if (params?.fieldId) searchParams.append('fieldId', params.fieldId);
    if (params?.farmId) searchParams.append('farmId', params.farmId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<Observation[]>(`/observations${query}`);
  },

  async createObservation(data: Partial<Observation> & { title: string; notes: string }): Promise<Observation> {
    const response = await apiClient.post<{ success: boolean; observation: Observation }>('/observations', data);
    return response.observation || (response as unknown as Observation);
  },

  async updateObservation(id: string, data: Partial<Observation>): Promise<Observation> {
    const response = await apiClient.patch<{ success: boolean; observation: Observation }>(`/observations/${id}`, data);
    return response.observation || (response as unknown as Observation);
  },

  async deleteObservation(id: string): Promise<{ success: boolean; id: string }> {
    return apiClient.delete<{ success: boolean; id: string }>(`/observations/${id}`);
  }
};
