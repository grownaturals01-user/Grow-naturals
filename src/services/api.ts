/**
 * GrowNaturals Billing — API Client Service
 */

const BASE_URL = '/api';

export function getActiveBusinessId(): string {
  return localStorage.getItem('gn_active_business') || 'all';
}

export function setActiveBusinessId(id: string): void {
  localStorage.setItem('gn_active_business', id);
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const activeBusiness = getActiveBusinessId();
  const token = localStorage.getItem('gn_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Business-Id': activeBusiness,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errMsg = errJson.error || errJson.message || errMsg;
    } catch {
      // fallback
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T = any>(endpoint: string, data?: any) => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T = any>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};
