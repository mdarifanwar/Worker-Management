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

  // Set up axios interceptors on mount
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  useEffect(() => {
      if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      setLoading(false);
      return;
    }
    // Only attempt to fetch profile automatically if one of these is true:
    // - there is a token in localStorage (fallback auth),
    // - the URL contains a token param (just returned from OAuth), or
    // - we have a cached user (might have valid cookie).
    const hasLocalToken = !!localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlToken = !!urlParams.get('token');
    const hasCachedUser = !!localStorage.getItem('user');

    if (!hasLocalToken && !hasUrlToken && !hasCachedUser) {
      // Skip profile fetch when there's no indication of authentication
      setUser(null);
      setLoading(false);
      return;
    }

    // Add a small delay to ensure backend is ready
    // setTimeout(() => 
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
    // }, 1000); // 1 second delay
  }, []);

  const login = async (identifier, password) => {
    try {
      console.log('[Frontend] Attempting login...');
      const response = await api.post('/auth/login', { identifier, password });
      console.log('[Frontend] Login response:', response.data);
      
      // If token is provided in response, store it as fallback for cross-origin cookie issues
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('[Frontend] Token stored as fallback');
      }
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('[Frontend] User set from login response');
      } else {
        console.log('[Frontend] Fetching profile after login...');
        // Add a small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data));
        console.log('[Frontend] User set from profile fetch');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Frontend] Login error:', error);
      return { success: false, message: error.response?.data?.message || 'Login failed' };
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
    localStorage.removeItem('token');
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
