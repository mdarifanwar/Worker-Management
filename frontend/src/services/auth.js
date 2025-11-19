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
    // Only fetch profile if we have a fallback token or cached user
    const hasLocalToken = !!localStorage.getItem('token');
    const hasCachedUser = !!localStorage.getItem('user');
    if (!hasLocalToken && !hasCachedUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Small startup delay to avoid immediate 401s during app init
    setTimeout(() => {
      api.get('/auth/profile')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }, 250);
  }, []);

  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', { identifier, password });

      // If token is provided in response, store it as fallback for cross-origin cookie issues
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Attempt to fetch profile as fallback
        await new Promise(resolve => setTimeout(resolve, 300));
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data);
        localStorage.setItem('user', JSON.stringify(profileRes.data));
      }

      return { success: true };
    } catch (error) {
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
