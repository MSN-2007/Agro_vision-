import { apiClient } from './apiClient';
import { ActivityLogItem } from '../../types/agro';

export const activityApiService = {
  async getActivity(limit = 50): Promise<ActivityLogItem[]> {
    return apiClient.get<ActivityLogItem[]>(`/activity?limit=${limit}`);
  },

  async createActivity(data: { title: string; detail: string; field?: string; type: ActivityLogItem['type']; source?: string }): Promise<ActivityLogItem> {
    const response = await apiClient.post<{ success: boolean; activity: ActivityLogItem }>('/activity', data);
    return response.activity || (response as unknown as ActivityLogItem);
  }
};
