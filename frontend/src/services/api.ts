import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@context/authContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

export const playerAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/players', { params: { page, limit } }),
  getById: (id: string) => apiClient.get(`/players/${id}`),
  getAnalytics: (id: string) => apiClient.get(`/players/${id}/analytics`),
  compare: (playerIds: string[]) =>
    apiClient.post('/players/compare', { playerIds }),
  update: (id: string, data: any) => apiClient.put(`/players/${id}`, data),
};

export const teamAPI = {
  getAll: () => apiClient.get('/teams'),
  getById: (id: string) => apiClient.get(`/teams/${id}`),
  getAnalytics: (id: string) => apiClient.get(`/teams/${id}/analytics`),
  getSquad: (id: string) => apiClient.get(`/teams/${id}/squad`),
  update: (id: string, data: any) => apiClient.put(`/teams/${id}`, data),
};

export const matchAPI = {
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/matches', { params: { page, limit } }),
  getById: (id: string) => apiClient.get(`/matches/${id}`),
  getPrediction: (id: string) => apiClient.get(`/matches/${id}/prediction`),
  getAnalysis: (id: string) => apiClient.get(`/matches/${id}/analysis`),
  create: (data: any) => apiClient.post('/matches', data),
};

export const insightAPI = {
  generatePlayerInsights: (playerId: string) =>
    apiClient.post(`/insights/player/${playerId}`),
  generateMatchNarrative: (matchId: string) =>
    apiClient.post(`/insights/match/${matchId}`),
  getAll: (page = 1, limit = 20) =>
    apiClient.get('/insights', { params: { page, limit } }),
};

export default apiClient;
