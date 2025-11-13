import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api, { BACKEND_ORIGIN } from '../services/api';
import { useAuth } from '../services/auth';

const ProfileUpdate = () => {
  const { user, loading, setUser } = useAuth();
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [logo, setLogo] = useState(null);
  const [status, setStatus] = useState('');

  // Helper to get correct logo URL
  const getLogoUrl = () => {
    if (!user.logo) return null;
    if (user.logo.startsWith('http')) {
      return user.logo;
    }
    return `${BACKEND_ORIGIN}/uploads/${user.logo}`;
  };

  if (loading) return <div>Loading...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('phone', phone);
    formData.append('address', address);
    if (logo) formData.append('logo', logo);

    try {
      const res = await api.put('/profile', formData);
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        toast.success('Profile updated!');
        setLogo(null);
        setCompanyName(res.data.user.companyName || '');
        setPhone(res.data.user.phone || '');
        setAddress(res.data.user.address || '');

        // Force update for Sidebar and Dashboard by triggering a custom event
        window.dispatchEvent(new Event('user-profile-updated'));
      } else {
        toast.error('Error updating profile.');
      }
    } catch (error) {
      toast.error('Error updating profile.');
    }
  };

  return (
    <div className="profile-update-container" style={{ maxWidth: 480, margin: '2.5rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(15,98,254,0.07)', padding: '2.5rem 2rem' }}>
      <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '1.5rem', color: '#2563eb', textAlign: 'center' }}>Update Company Profile</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#333' }}>Company Name</label>
          <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid #e0e7ef', fontSize: '1rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#333' }}>Phone</label>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid #e0e7ef', fontSize: '1rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#333' }}>Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)} style={{ padding: '0.7rem', borderRadius: 8, border: '1px solid #e0e7ef', fontSize: '1rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600, color: '#333' }}>Logo</label>
          {/* Only show the logo image, no debug info */}
          <img
            src={user.logo ? (user.logo.startsWith('http') ? user.logo : `${BACKEND_ORIGIN}/uploads/${user.logo}`) : '/default-logo.png'}
            alt="Company Logo"
            style={{ maxWidth: '120px', maxHeight: '120px', marginBottom: '0.5rem', borderRadius: 8, border: '1px solid #e0e7ef' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <input type="file" accept="image/*" onChange={e => setLogo(e.target.files[0])} style={{ fontSize: '1rem', border: 'none', background: 'none' }} />
        </div>
        <button type="submit" style={{ background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1.1rem', padding: '0.8rem 0', borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(15,98,254,0.10)', cursor: 'pointer', marginTop: '0.5rem' }}>Update Profile</button>
      </form>
      {status && <p style={{ marginTop: '1.5rem', color: status.includes('success') ? '#22c55e' : '#ef4444', textAlign: 'center', fontWeight: 600 }}>{status}</p>}
    </div>
  );
};

export default ProfileUpdate;
