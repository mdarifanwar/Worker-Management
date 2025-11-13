import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workersAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { Calendar, User, IndianRupee } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import ReportGenerator from '../components/reports/ReportGenerator';

const History = () => {
  const [workers, setWorkers] = useState([]);
  const [filteredWork, setFilteredWork] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    filterWork();
  }, [workers, searchTerm, dateFilter]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await workersAPI.getAll({ limit: 1000 }); // Get all workers
      setWorkers(response.data.workers);
    } catch (error) {
      toast.error('Error fetching work history');
    } finally {
      setLoading(false);
    }
  };

  const filterWork = () => {
    let allWork = [];
    
    // Flatten all work history from all workers
    workers.forEach(worker => {
      worker.workHistory.forEach(work => {
        allWork.push({
          ...work,
          workerName: worker.name,
          workerId: worker._id,
        });
      });
    });

    // Apply search filter
    if (searchTerm) {
      allWork = allWork.filter(work => 
        work.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.items.some(item => 
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        work.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter.startDate) {
      allWork = allWork.filter(work => 
        new Date(work.date) >= new Date(dateFilter.startDate)
      );
    }

    if (dateFilter.endDate) {
      allWork = allWork.filter(work => 
        new Date(work.date) <= new Date(dateFilter.endDate)
      );
    }

    // Sort by date (newest first)
    allWork.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setFilteredWork(allWork);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
  };

  if (loading) {
    return <div className="loading">Loading work history...</div>;
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Work History</h1>
        <p>Track all work activities and generate reports.</p>
      </div>

      <div className="history-layout">
        {/* Main Content: History Feed */}
        <div className="history-main-content">
          <div className="card">
            <div className="card-header">
              <h2>Recent Activities</h2>
              <span className="results-count">
                {filteredWork.length} records found
              </span>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="filters-section">
                <div className="filters-grid">
                  <div className="filter-group">
                    <SearchBar 
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search by worker, items, or notes..."
                    />
                  </div>
                  <div className="filter-group">
                    <div className="date-filters">
                      <input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  className="btn-secondary small"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>

              {/* History List */}
              {filteredWork.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={48} className="empty-icon" />
                  <h3>No work history found</h3>
                  <p>Try adjusting your filters or add work records.</p>
                </div>
              ) : (
                <div className="history-list">
                  {filteredWork.map((work, index) => (
                    <div 
                      key={`${work.workerId}-${work.date}-${index}`} 
                      className="history-item"
                    >
                      <div className="history-item-header">
                        <div className="worker-info">
                          <User size={16} />
                          <span className="worker-name">{work.workerName}</span>
                        </div>
                        <div className="work-date">
                          <Calendar size={14} />
                          <span>{format(parseISO(work.date), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>

                      <div className="work-details">
                        <div className="work-items">
                          {work.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="work-item-badge">
                              <span className="item-name">{item.itemName}</span>
                              <span className="item-quantity">{item.piecesCompleted} pcs</span>
                              <span className="item-amount">
                                <IndianRupee size={12} /> {item.totalWage.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        {work.notes && (
                          <div className="work-notes">
                            <strong>Notes:</strong> {work.notes}
                          </div>
                        )}
                      </div>

                      <div className="history-item-footer">
                        <div className="total-earned">
                          <IndianRupee size={16} />
                          <span>{work.totalEarned.toFixed(2)}</span>
                        </div>
                        <button 
                          className="btn-secondary small"
                          onClick={() => navigate(`/worker/${work.workerId}`)}
                        >
                          View Worker
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Report Generator */}
        <div className="history-sidebar">
          <div className="card">
            <div className="card-header">
              <h2>Generate Report</h2>
            </div>
            <div className="card-body">
              <ReportGenerator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;