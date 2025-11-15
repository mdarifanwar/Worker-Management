import axios from 'axios';

// Use environment variable if provided, otherwise use relative path for dev/prod flexibility
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// BACKEND_ORIGIN is useful for static asset URLs (uploads) which are served from backend origin
export const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || '';


// Send cookies with requests so HttpOnly auth cookie is included
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Note: we no longer add Authorization headers from localStorage. Server-set
// HttpOnly cookies are used for auth to avoid token leakage.

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Authentication failed — clear cached user and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Workers API
export const workersAPI = {
  getAll: (params) => api.get('/api/workers', { params }),
  getById: (id) => api.get(`/api/workers/${id}`),
  create: (data) => api.post('/api/workers', data),
  update: (id, data) => api.put(`/api/workers/${id}`, data),
  delete: (id) => api.delete(`/api/workers/${id}`),
  addWork: (id, data) => api.post(`/api/workers/${id}/work`, data),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
};

export default api;



