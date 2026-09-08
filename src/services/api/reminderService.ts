import { apiClient } from './apiClient';
import { FarmReminder } from '../../types/agro';

export const reminderService = {
  async getReminders(params?: { fieldId?: string }): Promise<FarmReminder[]> {
    const searchParams = new URLSearchParams();
    if (params?.fieldId) searchParams.append('fieldId', params.fieldId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<FarmReminder[]>(`/reminders${query}`);
  },

  async createReminder(data: Partial<FarmReminder> & { title: string; timeStr: string }): Promise<FarmReminder> {
    const response = await apiClient.post<{ success: boolean; reminder: FarmReminder }>('/reminders', data);
    return response.reminder || (response as unknown as FarmReminder);
  },

  async updateReminder(id: string, data: Partial<FarmReminder>): Promise<FarmReminder> {
    const response = await apiClient.patch<{ success: boolean; reminder: FarmReminder }>(`/reminders/${id}`, data);
    return response.reminder || (response as unknown as FarmReminder);
  },

  async deleteReminder(id: string): Promise<{ success: boolean; id: string }> {
    return apiClient.delete<{ success: boolean; id: string }>(`/reminders/${id}`);
  }
};
