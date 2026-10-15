import axios from 'axios';
import { getToken, logout } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and general errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url || '');
      const isAuthAttempt = url.includes('/api/auth/login') || url.includes('/api/auth/register') || url.endsWith('/api/auth');
      if (!isAuthAttempt) {
        logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else {
      const message: string =
        error.response?.data?.message || error.message || 'An unexpected error occurred';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api:error', { detail: { message } }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
