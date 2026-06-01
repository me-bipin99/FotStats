import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@context/authContext';
import { mockAuthAPI, mockPlayerAPI, mockTeamAPI, mockMatchAPI } from './mockApi';

const API_BASE_URL = 'http://localhost:3000/api/v1';
let useMockData = false;

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 3000,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors - fallback to mock data
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.warn('Backend unavailable, using mock data');
      useMockData = true;
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Fallback to mock if backend unavailable
const withMock = (realCall: () => Promise<any>, mockCall: () => Promise<any>) => {
  return realCall().catch((error) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('ERR_NETWORK')) {
      console.warn('Backend unavailable, using mock data');
      return mockCall();
    }
    throw error;
  });
};

export const authAPI = {
  login: (email: string, password: string) =>
    withMock(
      () => apiClient.post('/auth/login', { email, password }),
      () => mockAuthAPI.login(email, password)
    ),
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  refreshToken: () => apiClient.post('/auth/refresh'),
};

export const playerAPI = {
  getAll: (page = 1, limit = 20) =>
    withMock(
      () => apiClient.get('/players', { params: { page, limit } }),
      () => mockPlayerAPI.getAll(page, limit)
    ),
  getById: (id: string) =>
    withMock(
      () => apiClient.get(`/players/${id}`),
      () => mockPlayerAPI.getById(id)
    ),
  getAnalytics: (id: string) =>
    withMock(
      () => apiClient.get(`/players/${id}/analytics`),
      () => mockPlayerAPI.getAnalytics(id)
    ),
  compare: (playerIds: string[]) =>
    withMock(
      () => apiClient.post('/players/compare', { playerIds }),
      () => mockPlayerAPI.compare(playerIds)
    ),
  update: (id: string, data: any) => apiClient.put(`/players/${id}`, data),
};

export const teamAPI = {
  getAll: () =>
    withMock(
      () => apiClient.get('/teams'),
      () => mockTeamAPI.getAll()
    ),
  getById: (id: string) =>
    withMock(
      () => apiClient.get(`/teams/${id}`),
      () => mockTeamAPI.getById(id)
    ),
  getAnalytics: (id: string) => apiClient.get(`/teams/${id}/analytics`),
  getSquad: (id: string) =>
    withMock(
      () => apiClient.get(`/teams/${id}/squad`),
      () => mockTeamAPI.getSquad(id)
    ),
  update: (id: string, data: any) => apiClient.put(`/teams/${id}`, data),
};

export const matchAPI = {
  getAll: (page = 1, limit = 20) =>
    withMock(
      () => apiClient.get('/matches', { params: { page, limit } }),
      () => mockMatchAPI.getAll(page, limit)
    ),
  getById: (id: string) =>
    withMock(
      () => apiClient.get(`/matches/${id}`),
      () => mockMatchAPI.getById(id)
    ),
  getPrediction: (id: string) =>
    withMock(
      () => apiClient.get(`/matches/${id}/prediction`),
      () => mockMatchAPI.getPrediction(id)
    ),
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
export { useMockData };
