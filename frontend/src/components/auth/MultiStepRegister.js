import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api, { API_BASE_URL } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const MultiStepRegister = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    logo: null,
    name: '',
    phone: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [phoneError, setPhoneError] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Company details
  const handleCompanyDetails = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.name) {
      toast.error('Company name and your name are required');
      return;
    }
    setStep(2);
  };

  // Step 2: Contact details
  const handleContactDetails = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Indian phone number validation: starts with 6-9, exactly 10 digits
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!indianPhoneRegex.test(formData.phone)) {
      toast.error('Please enter a valid Indian phone number (10 digits, starts with 6-9)');
      return;
    }
    // Send OTP to backend for phone verification
    setLoading(true);
    api.post('/auth/register/send-otp', { email: formData.email })
      .then(res => {
        setLoading(false);
        const result = res.data;
        if (result.message) {
          toast.success(result.message);
          setStep(3);
        } else {
          toast.error(result.errors?.[0]?.msg || 'Failed to send OTP');
        }
      })
      .catch(() => {
        setLoading(false);
        toast.error('Failed to send OTP');
      });
  };

  // Step 3: OTP verification
  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (!formData.otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setStep(4);
  };

  // Step 4: Password creation
  const handlePasswordCreate = async (e) => {
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
    // Prepare FormData for registration
    const data = new FormData();
    data.append('companyName', formData.companyName);
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('password', formData.password);
    if (formData.logo) data.append('logo', formData.logo);
    // Add OTP for backend verification
    data.append('otp', formData.otp);
    try {
      const response = await api.post('/auth/register', data);
      const result = response.data;
      setLoading(false);
      if (result.token) {
        toast.success('Account created!');
        navigate('/login');
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  // Logo file handler
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, logo: file });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'phone') {
      const indianPhoneRegex = /^[6-9]\d{9}$/;
      if (value && !indianPhoneRegex.test(value)) {
        setPhoneError('Please enter a valid Indian phone number (10 digits, starts with 6-9)');
      } else {
        setPhoneError('');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create an Account</h1>
        {/* Google sign-up removed — registration uses email + OTP */}
        {step === 1 && (
          <form onSubmit={handleCompanyDetails}>
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Your Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Company Logo (optional)</label>
              <input type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} />
              {logoPreview && <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '120px', marginTop: '1rem' }} />}
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>Next</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleContactDetails}>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="e.g. 9876543210" />
              {phoneError && (
                <div style={{ color: 'red', fontSize: '0.95em', marginTop: '0.25em' }}>{phoneError}</div>
              )}
            </div>
            <div className="form-group">
              <label>Gmail</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@gmail.com" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>Send OTP</button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleOtpVerify}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input type="text" name="otp" value={formData.otp} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>Verify OTP</button>
          </form>
        )}
        {step === 4 && (
          <form onSubmit={handlePasswordCreate}>
            <div className="form-group">
              <label>Create Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>Create Account</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MultiStepRegister;
