import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import { BACKEND_ORIGIN } from '../../services/api';
import { 
  Users, 
  UserPlus, 
  History, 
  LogOut, 
  Menu, 
  X,
  MoreVertical,
  Info,
  Home
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = () => setProfileVersion(v => v + 1);
    window.addEventListener('user-profile-updated', handler);
    return () => window.removeEventListener('user-profile-updated', handler);
  }, []);

  const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/add-worker', icon: UserPlus, label: 'Add Worker' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/profile-update', icon: UserPlus, label: 'Company Profile' },
  { path: '/about', icon: Info, label: 'About' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Sidebar' : 'Open Sidebar'}
      >
        {isOpen 
          ? <MoreVertical size={24} />
          : <Menu size={24} />
        }
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header sidebar-header-mobile">
          <span className="sidebar-header-gap" />
          <img
            src={user.logo ? (user.logo.startsWith('http') ? user.logo : `${BACKEND_ORIGIN}/uploads/${user.logo}`) : '/default-logo.png'}
            alt="Company Logo"
            className="sidebar-company-logo"
            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e0e7ef', background: '#fff' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="company-info">
            <h3>{user?.companyName || 'Company'}</h3>
            <p>Worker Management</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;