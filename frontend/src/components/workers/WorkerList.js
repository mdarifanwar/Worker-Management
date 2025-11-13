import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  Users, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  IndianRupee,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp
} from 'lucide-react';
import WorkerCard from './WorkerCard';
import SearchBar from '../common/SearchBar';

const WorkerList = ({ 
  workers: externalWorkers, 
  onUpdate, 
  showHeader = true,
  limit = null 
}) => {
  const [workers, setWorkers] = useState(externalWorkers || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(!externalWorkers);

  useEffect(() => {
    if (!externalWorkers) {
      fetchWorkers();
    } else {
      setWorkers(externalWorkers);
    }
  }, [externalWorkers]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await workersAPI.getAll({ 
        search: searchTerm,
        limit: limit || 1000
      });
      setWorkers(response.data.workers);
    } catch (error) {
      toast.error('Error fetching workers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!externalWorkers) {
      // If we're managing our own data, refetch
      fetchWorkers();
    }
  };

  const sortedWorkers = [...workers].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'earnings':
        aValue = a.totalEarnings || 0;
        bValue = b.totalEarnings || 0;
        break;
      case 'workDays':
        aValue = a.workHistory.length;
        bValue = b.workHistory.length;
        break;
      case 'recent':
        aValue = a.workHistory.length > 0 
          ? new Date(a.workHistory[a.workHistory.length - 1].date).getTime()
          : 0;
        bValue = b.workHistory.length > 0 
          ? new Date(b.workHistory[b.workHistory.length - 1].date).getTime()
          : 0;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="loading-section">
        <div className="loading-spinner"></div>
        <p>Loading workers...</p>
      </div>
    );
  }

  return (
    <div className="worker-list-container">
      {showHeader && (
        <div className="list-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 1rem', background: 'var(--header-bg, #f8fafc)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(15,98,254,0.07)' }}>
          <div className="header-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={32} style={{ color: '#2563eb' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Workers</h2>
            </div>
            <span style={{ fontSize: '1.1rem', color: '#555', marginTop: '0.25rem' }}>
              Manage your workforce and track their performance
            </span>
            <span style={{ fontSize: '0.95rem', color: '#888' }}>
              Add, search, sort, and view detailed worker history all in one place.
            </span>
          </div>
          <div className="header-actions">
            <Link to="/add-worker" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1rem', padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
              <User size={20} />
              Add Worker
            </Link>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="list-controls">
        <div className="search-control">
          <SearchBar 
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search workers by name..."
          />
        </div>
        
        <div className="sort-control">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="earnings">Total Earnings</option>
            <option value="workDays">Work Days</option>
            <option value="recent">Most Recent</option>
          </select>
          <button 
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Workers Grid */}
      {sortedWorkers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <h3>No workers found</h3>
          <p>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Get started by adding your first worker'
            }
          </p>
          {!searchTerm && (
            <Link to="/add-worker" className="btn-primary">
              <User size={18} />
              Add First Worker
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="workers-grid">
            {sortedWorkers.map(worker => (
              <WorkerCard 
                key={worker._id} 
                worker={worker}
                onUpdate={onUpdate || fetchWorkers}
              />
            ))}
          </div>

          {limit && workers.length > limit && (
            <div className="load-more-section">
              <Link to="/" className="btn-secondary">
                View All Workers
              </Link>
            </div>
          )}
        </>
      )}

      {/* Summary Stats */}
      {sortedWorkers.length > 0 && (
        <div className="list-summary">
          <div className="summary-item">
            <Users size={16} />
            <span>{sortedWorkers.length} workers</span>
          </div>
          <div className="summary-item">
            <IndianRupee size={16} />
            <span>
              Total: {sortedWorkers.reduce((sum, worker) => 
                sum + (worker.totalEarnings || 0), 0
              ).toFixed(2)}
            </span>
          </div>
          <div className="summary-item">
            <Calendar size={16} />
            <span>
              {sortedWorkers.reduce((sum, worker) => 
                sum + worker.workHistory.length, 0
              )} work days
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerList;