import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const setupAxiosInterceptors = () => {
  // Response interceptor to handle unauthorized responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear cached user and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem('user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only attempt to fetch profile automatically if one of these is true:
    // - there is a local dev token in localStorage (dev fallback),
    // - the URL contains a token param (just returned from OAuth), or
    // - we are running in production (cookie-based auth is expected).
    const hasLocalToken = !!localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlToken = !!urlParams.get('token');

    if (!hasLocalToken && !hasUrlToken && process.env.NODE_ENV !== 'production') {
      // Skip profile fetch in dev when there is no token — avoids noisy 401/500
      // errors on initial unauthenticated page loads.
      setUser(null);
      setLoading(false);
      return;
    }

    // Add a small delay to ensure backend is ready
    setTimeout(() => {
      api.get('/auth/profile')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }, 1000); // 1 second delay
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      });
      // Server sets HttpOnly cookie; response includes user object
      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Fetch profile if not returned in response
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data));
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      // Server sets cookie; response includes user
      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data));
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    // Call backend to clear auth cookie
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    setUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};