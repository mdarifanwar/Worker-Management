import axios from 'axios';

// Use environment variable if provided, otherwise use full backend URL for production
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://worker-management-backend.onrender.com/api';

// BACKEND_ORIGIN is useful for static asset URLs (uploads) which are served from backend origin
export const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || 'https://worker-management-backend.onrender.com';


// Send cookies with requests so HttpOnly auth cookie is included
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include Authorization header as fallback
api.interceptors.request.use(
  (config) => {
    // If we have a token in localStorage, add it as Authorization header as fallback
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both user and token
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Workers API
export const workersAPI = {
  getAll: (params) => api.get('/workers', { params }),
  getById: (id) => api.get(`/workers/${id}`),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
  addWork: (id, data) => api.post(`/workers/${id}/work`, data),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

export default api;



