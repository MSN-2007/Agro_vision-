import { apiClient } from './apiClient';
import { FarmTask, TaskStatus } from '../../types/agro';

export const taskService = {
  async getTasks(params?: { fieldId?: string; status?: TaskStatus }): Promise<FarmTask[]> {
    const searchParams = new URLSearchParams();
    if (params?.fieldId) searchParams.append('fieldId', params.fieldId);
    if (params?.status) searchParams.append('status', params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<FarmTask[]>(`/tasks${query}`);
  },

  async createTask(data: Partial<FarmTask> & { title: string }): Promise<FarmTask> {
    const response = await apiClient.post<{ success: boolean; task: FarmTask }>('/tasks', data);
    return response.task || (response as unknown as FarmTask);
  },

  async updateTask(id: string, data: Partial<FarmTask>): Promise<FarmTask> {
    const response = await apiClient.patch<{ success: boolean; task: FarmTask }>(`/tasks/${id}`, data);
    return response.task || (response as unknown as FarmTask);
  },

  async deleteTask(id: string): Promise<{ success: boolean; id: string }> {
    return apiClient.delete<{ success: boolean; id: string }>(`/tasks/${id}`);
  }
};
