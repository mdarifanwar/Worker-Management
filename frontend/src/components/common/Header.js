import React from 'react';
import { useAuth } from '../../services/auth';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-info">
          <h1>{user?.companyName || 'Worker Management'}</h1>
          <p>Manage your workforce efficiently</p>
        </div>
        <div className="header-actions">
          <div className="user-info">
            <span>Welcome, {user?.companyName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;