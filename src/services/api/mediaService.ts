import { apiClient } from './apiClient';
import { MediaItem } from '../../types/agro';

export const mediaService = {
  async getMedia(params?: { fieldId?: string; farmId?: string }): Promise<MediaItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.fieldId) searchParams.append('fieldId', params.fieldId);
    if (params?.farmId) searchParams.append('farmId', params.farmId);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiClient.get<MediaItem[]>(`/media${query}`);
  },

  async createMedia(data: Omit<MediaItem, 'id' | 'timestamp'>): Promise<MediaItem> {
    const response = await apiClient.post<{ success: boolean; media: MediaItem }>('/media', data);
    return response.media || (response as unknown as MediaItem);
  },

  async deleteMedia(id: string): Promise<{ success: boolean; id: string }> {
    return apiClient.delete<{ success: boolean; id: string }>(`/media/${id}`);
  }
};
