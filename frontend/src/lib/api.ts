import type { ApiResponse, ApiError, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pd_os_token', token);
    } else {
      localStorage.removeItem('pd_os_token');
    }
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('pd_os_token');
  }
  return authToken;
}

// Request helpers
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(endpoint: string, params?: RequestOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options;

  const token = getAuthToken();
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint, params), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.error || 'An error occurred');
  }

  return data as T;
}

// API methods
export const api = {
  // Generic request methods
  get: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<ApiResponse<T>>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<ApiResponse<T>>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<ApiResponse<T>>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<ApiResponse<T>>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    request<ApiResponse<T>>(endpoint, { method: 'DELETE' }),

  // Paginated request
  paginated: <T>(endpoint: string, params?: RequestOptions['params']) =>
    request<PaginatedResponse<T>>(endpoint, { method: 'GET', params }),

  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      request<ApiResponse<{ user: unknown; token: string }>>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    register: (data: { email: string; password: string; name: string; timezone?: string }) =>
      request<ApiResponse<{ user: unknown; token: string }>>('/auth/register', {
        method: 'POST',
        body: data,
      }),

    me: () => request<ApiResponse<unknown>>('/auth/me'),

    updateProfile: (data: { name?: string; timezone?: string }) =>
      request<ApiResponse<unknown>>('/auth/profile', { method: 'PATCH', body: data }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<ApiResponse<null>>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
  },

  // Dashboard endpoints
  dashboard: {
    today: () => request<ApiResponse<unknown>>('/dashboard/today'),
    weekly: () => request<ApiResponse<unknown>>('/dashboard/weekly'),
    monthly: () => request<ApiResponse<unknown>>('/dashboard/monthly'),
    insights: () => request<ApiResponse<unknown>>('/dashboard/insights'),
    charts: (days?: number) => request<ApiResponse<unknown>>('/dashboard/charts', { params: days ? { days } : undefined }),
  },

  // Daily logs endpoints
  dailyLogs: {
    list: (params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
      api.paginated<unknown>('/daily-logs', params),
    get: (id: string) => api.get<unknown>(`/daily-logs/${id}`),
    getByDate: (date: string) => api.get<unknown>(`/daily-logs/date/${date}`),
    create: (data: unknown) => api.post<unknown>('/daily-logs', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/daily-logs/${id}`, data),
    upsertByDate: (date: string, data: unknown) => api.put<unknown>(`/daily-logs/date/${date}`, data),
    delete: (id: string) => api.delete<unknown>(`/daily-logs/${id}`),
    weeklySummary: () => api.get<unknown>('/daily-logs/weekly-summary'),
    aggregate: (date: string) => api.get<unknown>(`/daily-logs/aggregate/${date}`),
  },

  // IELTS endpoints
  ielts: {
    sessions: {
      list: (params?: { page?: number; limit?: number; skillType?: string }) =>
        api.paginated<unknown>('/ielts/sessions', params),
      get: (id: string) => api.get<unknown>(`/ielts/sessions/${id}`),
      create: (data: unknown) => api.post<unknown>('/ielts/sessions', data),
      update: (id: string, data: unknown) => api.put<unknown>(`/ielts/sessions/${id}`, data),
      delete: (id: string) => api.delete<unknown>(`/ielts/sessions/${id}`),
    },
    vocab: {
      list: (params?: { page?: number; limit?: number; search?: string; mastered?: boolean }) =>
        api.paginated<unknown>('/ielts/vocab', params),
      create: (data: unknown) => api.post<unknown>('/ielts/vocab', data),
      update: (id: string, data: unknown) => api.put<unknown>(`/ielts/vocab/${id}`, data),
      delete: (id: string) => api.delete<unknown>(`/ielts/vocab/${id}`),
    },
    stats: () => api.get<unknown>('/ielts/stats'),
  },

  // Journals endpoints
  journals: {
    list: (params?: { page?: number; limit?: number; search?: string; category?: string }) =>
      api.paginated<unknown>('/journals', params),
    get: (id: string) => api.get<unknown>(`/journals/${id}`),
    create: (data: unknown) => api.post<unknown>('/journals', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/journals/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/journals/${id}`),
    stats: () => api.get<unknown>('/journals/stats'),
  },

  // Books endpoints
  books: {
    list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
      api.paginated<unknown>('/books', params),
    get: (id: string) => api.get<unknown>(`/books/${id}`),
    getWithSessions: (id: string) => api.get<unknown>(`/books/${id}/sessions`),
    create: (data: unknown) => api.post<unknown>('/books', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/books/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/books/${id}`),
    stats: () => api.get<unknown>('/books/stats'),
    sessions: {
      list: (params?: { page?: number; limit?: number; bookId?: string }) =>
        api.paginated<unknown>('/books/sessions/all', params),
      get: (id: string) => api.get<unknown>(`/books/sessions/${id}`),
      create: (data: unknown) => api.post<unknown>('/books/sessions', data),
      update: (id: string, data: unknown) => api.put<unknown>(`/books/sessions/${id}`, data),
      delete: (id: string) => api.delete<unknown>(`/books/sessions/${id}`),
    },
  },

  // Skills endpoints
  skills: {
    list: (params?: { page?: number; limit?: number; category?: string }) =>
      api.paginated<unknown>('/skills', params),
    get: (id: string) => api.get<unknown>(`/skills/${id}`),
    create: (data: unknown) => api.post<unknown>('/skills', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/skills/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/skills/${id}`),
    stats: () => api.get<unknown>('/skills/stats'),
  },

  // Workouts endpoints
  workouts: {
    list: (params?: { page?: number; limit?: number; type?: string }) =>
      api.paginated<unknown>('/workouts', params),
    get: (id: string) => api.get<unknown>(`/workouts/${id}`),
    create: (data: unknown) => api.post<unknown>('/workouts', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/workouts/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/workouts/${id}`),
    stats: () => api.get<unknown>('/workouts/stats'),
  },

  // Wellness endpoints
  wellness: {
    list: (params?: { page?: number; limit?: number; type?: string }) =>
      api.paginated<unknown>('/wellness', params),
    get: (id: string) => api.get<unknown>(`/wellness/${id}`),
    create: (data: unknown) => api.post<unknown>('/wellness', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/wellness/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/wellness/${id}`),
    stats: () => api.get<unknown>('/wellness/stats'),
  },

  // Financial endpoints
  financial: {
    list: (params?: { page?: number; limit?: number; type?: string; category?: string }) =>
      api.paginated<unknown>('/financial', params),
    get: (id: string) => api.get<unknown>(`/financial/${id}`),
    create: (data: unknown) => api.post<unknown>('/financial', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/financial/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/financial/${id}`),
    stats: () => api.get<unknown>('/financial/stats'),
  },

  // Reflections endpoints
  reflections: {
    list: (params?: { page?: number; limit?: number; type?: string }) =>
      api.paginated<unknown>('/reflections', params),
    get: (id: string) => api.get<unknown>(`/reflections/${id}`),
    create: (data: unknown) => api.post<unknown>('/reflections', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/reflections/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/reflections/${id}`),
    stats: () => api.get<unknown>('/reflections/stats'),
  },

  // Career endpoints
  career: {
    activities: {
      list: (params?: { page?: number; limit?: number; type?: string }) =>
        api.paginated<unknown>('/career/activities', params),
      get: (id: string) => api.get<unknown>(`/career/activities/${id}`),
      create: (data: unknown) => api.post<unknown>('/career/activities', data),
      update: (id: string, data: unknown) => api.put<unknown>(`/career/activities/${id}`, data),
      delete: (id: string) => api.delete<unknown>(`/career/activities/${id}`),
    },
    applications: {
      list: (params?: { page?: number; limit?: number; status?: string }) =>
        api.paginated<unknown>('/career/applications', params),
      get: (id: string) => api.get<unknown>(`/career/applications/${id}`),
      create: (data: unknown) => api.post<unknown>('/career/applications', data),
      update: (id: string, data: unknown) => api.put<unknown>(`/career/applications/${id}`, data),
      delete: (id: string) => api.delete<unknown>(`/career/applications/${id}`),
      pipeline: () => api.get<unknown>('/career/applications/pipeline'),
    },
    stats: () => api.get<unknown>('/career/stats'),
  },

  // Masters prep endpoints
  mastersPrep: {
    list: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
      api.paginated<unknown>('/masters-prep', params),
    get: (id: string) => api.get<unknown>(`/masters-prep/${id}`),
    create: (data: unknown) => api.post<unknown>('/masters-prep', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/masters-prep/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/masters-prep/${id}`),
    addSession: (itemId: string, data: unknown) => api.post<unknown>(`/masters-prep/${itemId}/sessions`, data),
    stats: () => api.get<unknown>('/masters-prep/stats'),
    readiness: () => api.get<unknown>('/masters-prep/readiness'),
  },

  // Goals endpoints
  goals: {
    list: (params?: { page?: number; limit?: number; status?: string; category?: string }) =>
      api.paginated<unknown>('/goals', params),
    get: (id: string) => api.get<unknown>(`/goals/${id}`),
    create: (data: unknown) => api.post<unknown>('/goals', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/goals/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/goals/${id}`),
    byCategory: (category: string) => api.get<unknown>(`/goals/category/${category}`),
    stats: () => api.get<unknown>('/goals/stats'),
    progress: {
      list: (goalId: string) => api.get<unknown>(`/goals/${goalId}/progress`),
      add: (goalId: string, data: { date: string; value: number; note?: string }) =>
        api.post<unknown>(`/goals/${goalId}/progress`, data),
      update: (progressId: string, data: { date?: string; value?: number; note?: string }) =>
        api.put<unknown>(`/goals/progress/${progressId}`, data),
      delete: (progressId: string) => api.delete<unknown>(`/goals/progress/${progressId}`),
    },
  },

  // Projects endpoints
  projects: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.paginated<unknown>('/projects', params),
    get: (id: string) => api.get<unknown>(`/projects/${id}`),
    create: (data: unknown) => api.post<unknown>('/projects', data),
    update: (id: string, data: unknown) => api.put<unknown>(`/projects/${id}`, data),
    delete: (id: string) => api.delete<unknown>(`/projects/${id}`),
    getWithActivities: (id: string) => api.get<unknown>(`/projects/${id}/activities`),
  },
};

export default api;
