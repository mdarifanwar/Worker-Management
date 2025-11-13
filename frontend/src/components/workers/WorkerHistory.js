import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, IndianRupee, FileText } from 'lucide-react';

const WorkerHistory = ({ workHistory, onAddWork }) => {
  if (!workHistory || workHistory.length === 0) {
    return (
      <div className="empty-state">
        <Calendar size={48} className="empty-icon" />
        <h4>No work history recorded</h4>
        <p>Start tracking this worker's daily work and earnings</p>
        <button 
          className="btn-primary"
          onClick={onAddWork}
        >
          Add First Work Record
        </button>
      </div>
    );
  }

  // Calculate totals
  const totalEarnings = workHistory.reduce((sum, work) => sum + work.totalEarned, 0);
  const totalPieces = workHistory.reduce((sum, work) => 
    sum + work.items.reduce((itemSum, item) => itemSum + item.piecesCompleted, 0), 0
  );

  return (
    <div className="worker-history">
      <div className="section-header">
        <h3>Work History</h3>
        <div className="history-stats">
          <div className="stat-badge">
            <Calendar size={16} />
            <span>{workHistory.length} days</span>
          </div>
          <div className="stat-badge">
            <IndianRupee size={16} />
            <span>{totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="work-history-list">
        {workHistory
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((workDay, index) => (
          <div key={index} className="work-day-card">
            <div className="work-day-header">
              <div className="date-section">
                <Calendar size={16} />
                <h4>{format(parseISO(workDay.date), 'EEEE, MMMM dd, yyyy')}</h4>
              </div>
              <div className="earnings-section">
                <IndianRupee size={16} />
                <span className="total-earned">{workDay.totalEarned.toFixed(2)}</span>
              </div>
            </div>

            {workDay.notes && (
              <div className="work-notes">
                <FileText size={14} />
                <p>{workDay.notes}</p>
              </div>
            )}

            <div className="work-items-compact">
              {workDay.items.map((item, itemIndex) => (
                <div key={itemIndex} className="work-item-compact">
                  <div className="item-info">
                    <span className="item-name">{item.itemName}</span>
                    <div className="item-details">
                      <span>{item.piecesCompleted} pcs</span>
                      <span>@ ₹{item.wageRate}/pc</span>
                    </div>
                  </div>
                  <div className="item-total">
                    <IndianRupee size={14} />
                    {item.totalWage.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="work-day-summary">
              <div className="summary-item">
                <span>Total Pieces:</span>
                <span>
                  {workDay.items.reduce((sum, item) => sum + item.piecesCompleted, 0)}
                </span>
              </div>
              <div className="summary-item">
                <span>Items Worked:</span>
                <span>{workDay.items.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Summary */}
      <div className="overall-summary">
        <h4>Overall Summary</h4>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-value">{workHistory.length}</div>
            <div className="summary-label">Work Days</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              <IndianRupee size={20} />
              {totalEarnings.toFixed(2)}
            </div>
            <div className="summary-label">Total Earned</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{totalPieces}</div>
            <div className="summary-label">Total Pieces</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              <IndianRupee size={20} />
              {workHistory.length > 0 ? (totalEarnings / workHistory.length).toFixed(2) : '0.00'}
            </div>
            <div className="summary-label">Avg. Per Day</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerHistory;