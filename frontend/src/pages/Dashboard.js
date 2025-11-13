import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workersAPI, BACKEND_ORIGIN } from '../services/api';
import { useAuth } from '../services/auth';
import { toast } from 'react-toastify';
import SearchBar from '../components/common/SearchBar';
import WorkerCard from '../components/workers/WorkerCard';
import { Plus, Users, IndianRupee, User } from 'lucide-react';

// Modern Dashboard Header
const DashboardHeader = ({ user }) => {
  const [dateTime, setDateTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = dateTime.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Show logo if available
  const logoUrl = user?.logo
    ? (user.logo.startsWith('http') ? user.logo : `${BACKEND_ORIGIN}/uploads/${user.logo}`)
    : null;

  // Only show the logo image, no debug info

  // Only show the logo image, no debug info

  // Only show the logo image, no debug info

  return (
    <div className="dashboard-header-gradient" style={{
      background: 'linear-gradient(90deg, #e3f0ff 0%, #f5faff 100%)',
      borderRadius: '28px',
      boxShadow: '0 8px 32px rgba(15,98,254,0.10)',
      padding: '2.5rem 2rem 2rem 2rem',
      margin: '0.5rem 0',
      position: 'relative',
      minHeight: '170px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="dashboard-header-content" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        gap: '2.5rem',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {user?.logo ? (
              <img
                src={user.logo.startsWith('http') ? user.logo : `${BACKEND_ORIGIN}/uploads/${user.logo}`}
                alt="Company Logo"
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 8px 32px rgba(15,98,254,0.12)' }}
                onError={e => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.className = 'company-logo';
                  fallback.innerHTML = `<span>${user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'A'}</span>`;
                  e.target.parentNode.insertBefore(fallback, e.target.nextSibling);
                }}
              />
            ) : (
              <div className="company-logo">
                <span>{user?.companyName ? user.companyName.charAt(0).toUpperCase() : 'A'}</span>
              </div>
            )}
            <h1 className="dashboard-title" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>{user?.companyName || user?.name || 'Dashboard'}</h1>
          </div>
          <span className="dashboard-desc" style={{
            textAlign: 'left',
            fontSize: '1.18rem',
            color: '#1565c0',
            background: 'linear-gradient(90deg, #e3f2fd 0%, #f5faff 100%)',
            borderRadius: '10px',
            border: '1px solid #e3f0ff',
            padding: '0.35rem 1.1rem',
            marginLeft: '4px',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(15,98,254,0.07)',
            letterSpacing: '0.5px',
            display: 'inline-block',
          }}>
            {dayName}, {dateStr} | {timeStr}
          </span>
        </div>
        {/* Stylish User Details Card on right */}
  </div>
      <div className="dashboard-user-details-card" style={{
  position: 'relative',
  marginTop: '0.5rem',
  marginRight: '0.1rem',
  background: 'rgba(255,255,255,0.98)',
  boxShadow: '0 8px 32px rgba(15,98,254,0.13)',
  borderRadius: '22px',
  border: '1.5px solid #e3f0ff',
  padding: '1.5rem 2rem',
  minWidth: '400px',
  maxWidth: '450px',
  width: '100%',
  textAlign: 'left',
  fontSize: '1.18rem',
  color: '#1a237e',
  fontWeight: 500,
  boxSizing: 'border-box',
  zIndex: 2,
      }}>
        <style>{`
          .dashboard-user-details-card span {
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            max-width: 100%;
            display: inline-block;
          }
          @media (max-width: 1200px) {
            .dashboard-user-details-card {
              float: none !important;
              margin-right: 0 !important;
              margin-top: 1rem !important;
              max-width: 95vw !important;
              padding: 1.2rem 1rem !important;
            }
          }
          @media (max-width: 900px) {
            .dashboard-header-gradient {
              padding: 1.2rem 0.5rem 0.5rem 0.5rem !important;
              min-height: 0 !important;
            }
            .dashboard-header-content {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 1.2rem !important;
              position: static !important;
            }
            .dashboard-user-details-card {
              position: static !important;
              margin-left: 0 !important;
              margin-top: 1.5rem !important;
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
              border-radius: 18px !important;
              padding: 1.2rem 0.7rem !important;
            }
          }
          @media (max-width: 600px) {
            .dashboard-header-gradient {
              padding: 0.5rem 0.2rem !important;
            }
            .dashboard-header-content {
              padding: 0 !important;
            }
            .dashboard-user-details-card {
              padding: 2.5rem 2rem !important;
              font-size: 1.25rem !important;
              min-width: 400px !important;
              max-width: 700px !important;
              box-shadow: 0 4px 24px rgba(21,101,192,0.12);
              border-radius: 1.5rem !important;
            }
            .dashboard-title {
              font-size: 1.3rem !important;
            }
          }
        `}</style>
        {/* Responsive styles */}
        <style>{`
          @media (max-width: 900px) {
            .dashboard-header-content {
              flex-direction: column !important;
              align-items: flex-start !important;
              padding: 1.2rem 0.5rem !important;
            }
            .dashboard-user-details-card {
              margin-left: 0 !important;
              margin-top: 1.5rem !important;
              width: 100% !important;
              min-width: 0 !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
              padding: 2rem 1rem !important;
              font-size: 1.1rem !important;
            }
          }
          @media (max-width: 600px) {
            .dashboard-header-content {
              padding: 0.5rem 0.2rem !important;
            }
            .dashboard-user-details-card {
              padding: 1rem 0.7rem !important;
              font-size: 0.98rem !important;
            }
            .dashboard-title {
              font-size: 1.3rem !important;
            }
          }
        `}</style>
          {user?.companyName && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7rem' }}>
              <span style={{ marginRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e3f2fd', borderRadius: 8, width: 28, height: 28 }}>
                <User size={16} color="#1565c0" />
              </span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px', display: 'inline-block' }}><strong>Name:</strong> {user.companyName}</span>
            </div>
          )}
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7rem', width: '100%' }}>
              <span style={{ marginRight: 10 }}>
                <svg width={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} height={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#e3f2fd"/><path d="M4 8.5V16a2 2 0 002 2h12a2 2 0 002-2V8.5l-8 5.5-8-5.5z" fill="#1565c0"/><path d="M20 8.5l-8 5.5-8-5.5" stroke="#1565c0" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </span>
              <span style={{ whiteSpace: 'normal', overflowWrap: 'break-word', textOverflow: 'clip', maxWidth: '100%', display: 'inline-block' }}><strong>Email:</strong> {user.email}</span>
            </div>
          )}
        {user?.phone && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7rem', width: '100%' }}>
            <span style={{ marginRight: 10 }}>
              <svg width={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} height={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#e3f2fd"/><path d="M7 6.5a1.5 1.5 0 012.1-.1l2.1 1.7a1.5 1.5 0 01.5 1.6l-.5 2.1a10.5 10.5 0 005.1 5.1l2.1-.5a1.5 1.5 0 011.6.5l1.7 2.1a1.5 1.5 0 01-.1 2.1l-2.2 2.2c-1.2 1.2-3.1 1.2-4.3 0A16.5 16.5 0 017 6.5z" fill="#1565c0"/></svg>
            </span>
            <span style={{ whiteSpace: 'normal', overflowWrap: 'break-word', textOverflow: 'clip', maxWidth: '100%', display: 'inline-block' }}><strong>Phone:</strong> {user.phone}</span>
          </div>
        )}
          {user?.address && (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ marginRight: 10 }}>
                <svg width={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} height={user?.companyName && user.companyName.length < 10 ? "28" : user?.companyName && user.companyName.length < 18 ? "24" : "20"} viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#e3f2fd"/><path d="M12 7l-7 7h3v4h8v-4h3l-7-7z" fill="#1565c0"/></svg>
              </span>
              <span style={{ whiteSpace: 'normal', overflowWrap: 'break-word', textOverflow: 'clip', maxWidth: '100%', display: 'inline-block' }}><strong>Address:</strong> {user.address}</span>
            </div>
          )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [workers, setWorkers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkers: 0,
    totalEarnings: 0,
    activeWorkers: 0
  });

  const { user } = useAuth();
  const [profileVersion, setProfileVersion] = useState(0);
  useEffect(() => {
    const handler = () => setProfileVersion(v => v + 1);
    window.addEventListener('user-profile-updated', handler);
    return () => window.removeEventListener('user-profile-updated', handler);
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, []); // Fetch only on initial load

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      // Fetch all workers initially, search will be client-side for this setup
      const response = await workersAPI.getAll({}); 
      const allWorkers = response.data.workers;
      setWorkers(allWorkers);
      
      // Calculate stats from all workers
      const totalEarnings = allWorkers.reduce((total, worker) => {
        return total + (worker.totalEarnings || 0);
      }, 0);

      setStats({
        totalWorkers: response.data.total,
        totalEarnings,
        activeWorkers: allWorkers.filter(w => w.isActive).length
      });
    } catch (error) {
      toast.error('Error fetching workers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-page">
      <DashboardHeader user={user} />
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p>Total Workers</p>
            <h3>{stats.totalWorkers}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <p>Total Paid</p>
            <h3>₹{stats.totalEarnings.toFixed(2)}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <p>Active Workers</p>
            <h3>{stats.activeWorkers}</h3>
          </div>
        </div>
      </div>
      {/* Workers Management Section */}
      <div className="workers-management-card">
        <div className="card-header">
          <h2>Employees</h2>
          <div className="card-controls">
            <SearchBar value={searchTerm} onChange={handleSearch} />
            <Link to="/add-worker" className="btn-primary">
              <Plus size={18} />
              Add Worker
            </Link>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="loading">Loading workers...</div>
          ) : filteredWorkers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <h3>No workers found for "{searchTerm}"</h3>
              <p>Get started by adding your first worker.</p>
            </div>
          ) : (
            <div className="workers-grid">
              {filteredWorkers.map(worker => (
                <WorkerCard 
                  key={worker._id} 
                  worker={worker}
                  onUpdate={fetchWorkers}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;