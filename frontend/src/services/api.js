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

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {

      
      
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
      localStorage.removeItem('user');
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



