import axios from 'axios';

// Enhanced logging for monitoring authentication flow
const persistentLog = (level, ...args) => {
  const timestamp = new Date().toISOString();
  
  // Always log to console for monitoring
  console[level](`[${timestamp}]`, ...args);
  
  // Store in sessionStorage for debugging (always enabled for auth troubleshooting)
  try {
    const logEntry = {
      timestamp,
      level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
    };
    
    const existingLogs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 logs in production for better debugging
    const maxLogs = process.env.NODE_ENV === 'production' ? 100 : 50;
    if (existingLogs.length > maxLogs) {
      existingLogs.splice(0, existingLogs.length - maxLogs);
    }
    
    sessionStorage.setItem('debug_logs', JSON.stringify(existingLogs));
  } catch (e) {
    // Silently fail if sessionStorage is not available
  }
};

// Export logger functions
export const debugLog = (...args) => persistentLog('log', ...args);
export const debugWarn = (...args) => persistentLog('warn', ...args);
export const debugError = (...args) => persistentLog('error', ...args);

// Function to display stored logs
export const showStoredLogs = () => {
  const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
  console.group('🔍 Stored Debug Logs (survives refresh)');
  logs.forEach(log => {
    console[log.level](`[${log.timestamp}] ${log.message}`);
  });
  console.groupEnd();
  return logs;
};

// Make debug functions available (always enabled for auth troubleshooting)
if (typeof window !== 'undefined') {
  // Auto-show stored logs on page load (if any exist)
  setTimeout(() => {
    try {
      const logs = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
      if (logs.length > 0) {
        console.log('📋 Previous session logs found. Use showStoredLogs() to view them or enable debug panel.');
        // Show recent logs automatically in development
        if (process.env.NODE_ENV === 'development') {
          const recentLogs = logs.slice(-3);
          console.group('🔍 Recent logs from previous session:');
          recentLogs.forEach(log => {
            console[log.level](`[${log.timestamp}] ${log.message}`);
          });
          console.groupEnd();
        }
      }
    } catch (e) {
      // Silently fail
    }
    
    // Make functions globally available for console access
    try {
      window.showStoredLogs = showStoredLogs;
      window.clearStoredLogs = clearStoredLogs;
      window.debugLog = debugLog;
      window.debugWarn = debugWarn;
      window.debugError = debugError;
      // Add function to enable debug panel in production
      window.enableDebugPanel = () => {
        localStorage.setItem('enableDebugPanel', 'true');
        console.log('🔍 Debug panel enabled. Refresh the page to see it.');
      };
      window.disableDebugPanel = () => {
        localStorage.removeItem('enableDebugPanel');
        console.log('🔍 Debug panel disabled. Refresh the page to hide it.');
      };
    } catch (e) {
      // Silently fail
    }
  }, 1000);
}

// Function to clear stored logs
export const clearStoredLogs = () => {
  sessionStorage.removeItem('debug_logs');
  console.log('🧹 Stored logs cleared');
};

// Use local backend for testing
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002/api';

// BACKEND_ORIGIN is useful for static asset URLs (uploads) which are served from backend origin
export const BACKEND_ORIGIN = process.env.REACT_APP_BACKEND_ORIGIN || 'http://localhost:5002';


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
      debugLog('[API] Adding Authorization header to request:', config.url);
    }
    debugLog('[API] Making request to:', config.url, 'with credentials:', config.withCredentials);
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent redirect during active login process
let isLoggingIn = false;

export const setLoginInProgress = (inProgress) => {
  isLoggingIn = inProgress;
};

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      debugError('[API] 401 Unauthorized received for:', error.config?.url, 'isLoggingIn:', isLoggingIn);
      debugError('[API] Request headers were:', error.config?.headers);
      debugError('[API] Current path:', window.location.pathname);
      
      // Don't redirect if we're in the middle of a login process
      if (!isLoggingIn) {
        // Clear both user and token
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          debugError('[API] 401 received, redirecting to login');
          window.location.href = '/login';
        }
      } else {
        debugWarn('[API] 401 received during login, not redirecting');
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



