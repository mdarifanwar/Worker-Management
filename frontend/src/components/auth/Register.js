import React, { useState } from 'react';
// Sticky top bar from Login.js
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [resending, setResending] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    logo: null,
    email: '',
    phone: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo' && files && files[0]) {
      setFormData({ ...formData, logo: files[0] });
      setLogoPreview(URL.createObjectURL(files[0]));
    } else if (name === 'phone') {
      // Remove +91 and spaces automatically
      let cleaned = value.replace(/\+91/g, '').replace(/\s+/g, '');
      setFormData({ ...formData, phone: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Step 1: Company info
  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!formData.companyName) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.ownerName) {
      toast.error('Owner name is required');
      return;
    }
    setStep(2);
  };

  // Step 2: Contact info
  const handleNextStep2 = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    const phoneRegex = /^(\+91)?[6-9][0-9]{9}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid Gmail address');
      return;
    }
    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error('Please enter a valid phone number');
      return;
    }
    // Send OTP request to backend (only email)
    api.post('/auth/register/send-otp', { email: formData.email })
      .then(res => {
        const result = res.data;
        if (result.message && result.message.toLowerCase().includes('otp')) {
          setOtpSent(true);
          setStep(3);
          toast.success('OTP sent to your email');
        } else {
          toast.error(result.message || 'Failed to send OTP');
        }
      })
      .catch(() => {
        toast.error('Failed to send OTP');
      });
  };

  // Step 3: OTP verification
  const handleNextStep3 = (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length < 4) {
      toast.error('Please enter the OTP');
      return;
    }
    setStep(4);
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register/send-otp', {
        email: formData.email,
      });
      setStep(3);
      toast.success(response.data.message || 'OTP sent successfully');
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        setError(err.response.data.errors[0].msg);
        toast.error(err.response.data.errors[0].msg);
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP');
        toast.error(err.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
    setResending(false);
  };

  // Step 4: Password
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    // Prepare FormData for file upload
    const data = new FormData();
  data.append('companyName', formData.companyName);
  data.append('ownerName', formData.ownerName);
  data.append('email', formData.email);
  data.append('password', formData.password);
    if (formData.logo) data.append('logo', formData.logo);
    // Simulate OTP verification
    data.append('otp', formData.otp);
    try {
      const response = await api.post('/auth/register', data);
      const result = response.data;
      if (result.token) {
        toast.success('Account created!');
        navigate('/login');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

    return (
      <>
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
      {error && (
        <div style={{ color: 'red', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.95rem' }}>{error}</div>
      )}
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={28} />
          </div>
          <h1>Create an Account</h1>
          <p>Join us to manage your workforce efficiently</p>
        </div>
        <button
          type="button"
          className="btn-google"
          style={{ width: '100%', marginBottom: '1rem', background: '#fff', color: '#333', border: '1px solid #ddd', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => window.location.href = '/api/auth/google'}
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png" alt="Gmail" style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} />
          Sign up with Gmail
        </button>
        {/* Step 1: Company info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="auth-form" encType="multipart/form-data">
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Your Company Inc."
              />
            </div>
            <div className="form-group">
              <label htmlFor="ownerName">Owner Name</label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                placeholder="Owner Name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="logo">Logo (PNG/JPG) <span style={{color:'#888'}}>(optional)</span></label>
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/png, image/jpeg"
                  onChange={handleChange}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
                <label htmlFor="logo" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6',
                  color: '#2563eb',
                  border: '1px solid #e0e7ef',
                  borderRadius: 8,
                  fontWeight: 600,
                  padding: '0.7rem',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: logoPreview ? '0.5rem' : 0
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12l4-4m0 0l4 4m-4-4v12" /></svg>
                  Choose Logo File
                </label>
              </div>
              {logoPreview && (
                <img src={logoPreview} alt="Logo Preview" style={{ marginTop: '1rem', maxWidth: '120px', borderRadius: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
              )}
            </div>
            <button type="submit" className="btn-primary full-width">Next</button>
          </form>
        )}
        {/* Step 2: Contact info */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="xxxxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+91-XXXXXXXX"
              />
            </div>
            <button type="submit" className="btn-primary full-width">Next</button>
          </form>
        )}
        {/* Step 3: OTP verification */}
        {step === 3 && (
          <form onSubmit={handleNextStep3} className="auth-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP sent to your phone/email</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                required
                placeholder="Enter OTP"
              />
            </div>
            <button type="submit" className="btn-primary full-width" style={{ marginBottom: '0.75rem' }}><span style={{display:'flex',justifyContent:'center',alignItems:'center',width:'100%'}}>Next</span></button>
            <button type="button" className="btn-secondary full-width" onClick={handleResendOtp} disabled={resending} style={{ background: '#f3f4f6', color: '#2563eb', border: 'none', fontWeight: 600 }}>
              {resending ? 'Resending...' : 'Resend OTP'}
            </button>
          </form>
        )}
        {/* Step 4: Password */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Minimum 6 characters"
                minLength="6"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
                minLength="6"
              />
            </div>
            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Creating Account...' : 'Submit'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default Register;