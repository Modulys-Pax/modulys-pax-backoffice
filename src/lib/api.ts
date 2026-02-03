import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/admin';

interface RequestOptions extends RequestInit {
  body?: any;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = Cookies.get('admin_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    Cookies.remove('admin_token');
    Cookies.remove('admin_user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Auth
export const authService = {
  login: (email: string, password: string) => 
    api.post<{ user: any; accessToken: string }>('/auth/login', { email, password }),
};

// Tenants
export const tenantsService = {
  findAll: () => api.get<any[]>('/tenants'),
  findById: (id: string) => api.get<any>(`/tenants/${id}`),
  getStatistics: () => api.get<any>('/tenants/statistics'),
  create: (data: any) => api.post<any>('/tenants', data),
  update: (id: string, data: any) => api.patch<any>(`/tenants/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch<any>(`/tenants/${id}/status`, { status }),
  setModules: (id: string, moduleIds: string[]) => api.patch<any>(`/tenants/${id}/modules`, { moduleIds }),
  enableModule: (id: string, moduleId: string) => api.post<any>(`/tenants/${id}/modules/${moduleId}/enable`),
  disableModule: (id: string, moduleId: string) => api.post<any>(`/tenants/${id}/modules/${moduleId}/disable`),
  delete: (id: string) => api.delete<any>(`/tenants/${id}`),
};

// Plans
export const plansService = {
  findAll: () => api.get<any[]>('/plans'),
  create: (data: any) => api.post<any>('/plans', data),
};

// Modules
export const modulesService = {
  findAll: (isCustom?: boolean) => {
    const query = isCustom !== undefined ? `?isCustom=${isCustom}` : '';
    return api.get<any[]>(`/modules${query}`);
  },
  findById: (id: string) => api.get<any>(`/modules/${id}`),
  create: (data: any) => api.post<any>('/modules', data),
  update: (id: string, data: any) => api.patch<any>(`/modules/${id}`, data),
  delete: (id: string) => api.delete<any>(`/modules/${id}`),
  seed: () => api.post<any>('/modules/seed'),
};

// Subscriptions
export const subscriptionsService = {
  create: (data: any) => api.post<any>('/subscriptions', data),
};

// Provisioning
export const provisioningService = {
  provision: (tenantId: string) => api.post<any>(`/provisioning/tenant/${tenantId}`),
};

// Migrations
export const migrationsService = {
  apply: (tenantId: string) => api.post<any>(`/migrations/tenant/${tenantId}/apply`),
  getStatus: (tenantId: string) => api.get<any>(`/migrations/tenant/${tenantId}/status`),
};
