import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import api, { API_BASE_URL } from '../../services/api';
import { toast } from 'react-toastify';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handle JWT from Google OAuth
  useEffect(() => {
    // After OAuth redirect the server sets an HttpOnly cookie. Fetch the
    // profile to confirm authentication and route user accordingly.
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      // In development we only auto-fetch profile if a token was provided
      // (dev fallback) so we don't spam the backend with unauthenticated
      // requests that return 401 when the user is on the login page.
      if (token && process.env.NODE_ENV !== 'production') {
        // Development-only fallback: set Authorization header and local token so
        // the frontend can fetch profile. This is NOT used in production.
        localStorage.setItem('token', token);
        api.defaults.headers = api.defaults.headers || {};
        api.defaults.headers.common = api.defaults.headers.common || {};
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Only attempt to fetch profile automatically if we have a token or
      // we're running in production (where cookie-based sessions are expected).
      const shouldFetchProfile = Boolean(token) || process.env.NODE_ENV === 'production';

      if (!shouldFetchProfile) return; // skip profile fetch on dev login page

      // Add a small delay to ensure backend is ready
      setTimeout(() => {
        api.get('/auth/profile')
          .then(res => {
            const user = res.data;
            if (user && user.companyName && user.phone) {
              localStorage.setItem('user', JSON.stringify(user));
              navigate('/');
            } else {
              toast.info('Please complete your profile.');
              localStorage.setItem('user', JSON.stringify(user));
              navigate('/profile-update');
            }
          })
          .catch(() => {
            // Not authenticated or profile fetch failed; no-op
          });
      }, 1000); // 1 second delay
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

  const result = await login(formData.identifier, formData.password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      toast.error(result.message);
    }
    
    setLoading(false);
  };

  return (
  <>
      {/* Sticky top bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        width: '100%',
        height: '72px',
        background: 'linear-gradient(90deg, rgba(14,82,160,0.98) 0%, rgba(21,101,192,0.98) 50%, rgba(3,169,244,0.95) 100%)',
        color: '#fff',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 8px 30px rgba(10, 31, 68, 0.18)',
        backdropFilter: 'saturate(140%) blur(6px)',
      }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <img
                src={process.env.PUBLIC_URL + '/logo.png'}
                alt="Worker Management Logo"
                style={{ width: 90, height: 90, objectFit: 'contain', display: 'block' }}
                onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.02em' }}>Worker Management</span>
              <span style={{ fontSize: '12px', opacity: 0.9, marginTop: 2 }}>Manage your workforce with confidence</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <LogIn size={25} />
            </div>
            <h1>Welcome</h1>
            <p>Sign in to manage your workforce</p>
          </div>
          <a
            href="/api/auth/google"
            className="btn-google"
            style={{
              width: '100%',
              marginBottom: '1rem',
              background: '#fff',
              color: '#444',
              border: '1px solid #e0e0e0',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s',
            }}
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png" alt="Gmail" style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
            <span style={{ fontWeight: 500 }}>Login with Gmail</span>
          </a>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Email or Phone Number</label>
                <input
                  type="text"
                  id="identifier"
                  name="identifier"
                  required
                  placeholder="Email or Phone"
                  autoComplete="username"
                  value={formData.identifier}
                  onChange={handleChange}
                />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <Link to="/reset" className="auth-link">Forgot Password?</Link>
            </div>
            <button 
              type="submit" 
              className="btn-primary full-width"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};


export default Login;