import { apiClient } from './apiClient';
import { SmartGlassesDevice } from '../../types/agro';

export const deviceApiService = {
  async getDevices(): Promise<SmartGlassesDevice[]> {
    return apiClient.get<SmartGlassesDevice[]>('/devices');
  },

  async registerDevice(data: Partial<SmartGlassesDevice> & { deviceId: string; name: string; deviceType: string }): Promise<SmartGlassesDevice> {
    const response = await apiClient.post<{ success: boolean; device: SmartGlassesDevice }>('/devices/register', data);
    return response.device || (response as unknown as SmartGlassesDevice);
  },

  async heartbeat(deviceId: string, data: { status: string; batteryLevel?: number }): Promise<SmartGlassesDevice> {
    const response = await apiClient.post<{ success: boolean; device: SmartGlassesDevice }>(`/devices/${deviceId}/heartbeat`, data);
    return response.device || (response as unknown as SmartGlassesDevice);
  }
};
