// Centralized API Client for AgroVision Shared Backend
const API_BASE = '/api';

export interface RequestOptions extends RequestInit {
  source?: 'website' | 'mobile' | 'raspberry_pi';
}

class ApiClient {
  private userId: string = 'user-ravi-01';
  private defaultSource: 'website' | 'mobile' | 'raspberry_pi' = 'website';

  public setUserId(id: string) {
    this.userId = id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
      'x-source': options.source || this.defaultSource,
      ...(options.headers as Record<string, string> || {})
    };

    const config: RequestInit = {
      ...options,
      headers
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error || errorJson.message) {
          errorMsg = errorJson.error || errorJson.message;
        }
      } catch {
        // Fallback to default message
      }
      throw new Error(errorMsg);
    }

    return response.json() as Promise<T>;
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
