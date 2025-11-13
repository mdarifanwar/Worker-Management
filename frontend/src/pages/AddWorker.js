import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workersAPI } from '../services/api';
import { useAuth } from '../services/auth';
import { toast } from 'react-toastify';
import { ArrowLeft, UserPlus } from 'lucide-react';

const AddWorker = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();

  // Check if user is authenticated via auth context
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please login first');
      navigate('/login');
    }
  }, [navigate, user, loading]);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure user still logged in
    if (!user) {
      toast.error('Authentication token missing. Please login again.');
      navigate('/login');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required.');
      return;
    }
  setSubmitting(true);

    try {
      await workersAPI.create(formData);
      toast.success('Worker added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error details:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error adding worker');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-worker-page">
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(-1)}
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="header-title">
          <UserPlus size={24} />
          <h1>Add New Worker</h1>
        </div>
      </div>

      <div className="form-container modern-form">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Worker Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number <span style={{color: 'red'}}>*</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="e.g., 9876543210"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john.doe@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              placeholder="Enter worker's full address"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorker;