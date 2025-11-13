import api from '../services/api';

export const testAuthentication = async () => {
  const user = localStorage.getItem('user');

  console.log('=== AUTH DEBUG INFO ===');
  console.log('User cached:', !!user);
  console.log('User:', user);

  try {
    const res = await api.get('/auth/profile');
    console.log('Profile API Status:', res.status);
    console.log('Profile API Response:', res.data);
  } catch (err) {
    console.error('Profile API Error:', err);
  }
};