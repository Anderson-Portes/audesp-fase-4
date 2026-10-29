import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Interceptor to add auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid or expired: clear auth and reload login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Force reload to go to login (or navigate if router used)
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

