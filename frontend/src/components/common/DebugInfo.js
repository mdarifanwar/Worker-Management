import React from 'react';
import { useAuth } from '../../services/auth';

const DebugInfo = () => {
  const { user } = useAuth();

  return (
    <div style={{ 
      background: '#f8f9fa', 
      padding: '10px', 
      border: '1px solid #dee2e6',
      fontSize: '12px',
      marginBottom: '10px'
    }}>
      <strong>Debug Info:</strong><br />
  User: {user ? 'Logged In' : 'Not Logged In'}<br />
  {user && <span>User Email: {user.email}</span>}
    </div>
  );
};

export default DebugInfo;