import React, { useState } from 'react';
import api, { workersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Download, Share2, FileText, Calendar } from 'lucide-react';

const ReportGenerator = ({ workerId, workerName }) => {
  const [reportType, setReportType] = useState(workerId ? 'worker' : 'summary');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [includeNotes, setIncludeNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateReport = async () => {
    setLoading(true);
    toast.info('Generating report, please wait...');

    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        includeNotes: includeNotes ? 'true' : 'false',
      };

      let response;
      if (reportType === 'worker' && workerId) {
        // Use server-side HTML->PDF (Puppeteer) route for downloads so layout and images
        // match the printed version. This inlines logos and respects CSS page-break rules.
        response = await api.get(`/reports/worker/${workerId}/htmlpdf`, {
          params,
          responseType: 'blob',
        });
      } else {
        response = await api.get('/reports/summary', {
          params,
          responseType: 'blob',
        });
      }

      // Create a URL for the blob
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      // Trigger download
      const link = document.createElement('a');
      link.href = fileURL;
      const fileName = reportType === 'worker' && workerName 
        ? `report_${workerName.replace(/\s/g, '_')}.pdf`
        : 'summary_report.pdf';
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);

      toast.success('Report downloaded successfully!');
      
    } catch (error) {
      let errorMsg = 'Error generating report. Please try again.';
      try {
        if (error.response && error.response.data) {
          const data = error.response.data;
          if (data instanceof Blob) {
            // Try to extract JSON message from blob
            const text = await data.text();
            try {
              const json = JSON.parse(text);
              errorMsg = json.message || text;
            } catch (e) {
              errorMsg = text || errorMsg;
            }
          } else if (data.message) {
            errorMsg = `Error: ${data.message}`;
          }
        }
      } catch (e) {
        // ignore parsing errors
      }
      toast.error(errorMsg);
      console.error('Report generation error:', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    try {
      const message = `Report for ${workerName || 'all workers'}`;
      const response = await api.post('/reports/share', {
        workerId: workerId,
        message: message
      });

      const data = response.data;
      // Open WhatsApp with the shareable link
      if (data && data.shareableLink) {
        window.open(data.shareableLink, '_blank');
        toast.success('Report shared via WhatsApp!');
      } else {
        toast.error('Error sharing report');
      }
    } catch (error) {
      toast.error('Error sharing report');
      console.error('Share error:', error);
    }
  };

  return (
    <div className="report-generator">
      <div className="report-header">
        <FileText size={24} />
        <h3>Generate Report</h3>
      </div>

      <div className="report-form">
        <div className="form-group">
          <label>Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            disabled={!workerId && reportType === 'worker'}
          >
            <option value="worker" disabled={!workerId}>
              {workerId ? 'Worker Report' : 'Select a worker for individual report'}
            </option>
            <option value="summary">Summary Report (All Workers)</option>
          </select>
          {!workerId && reportType === 'worker' && (
            <small className="text-warning">Select a worker to generate individual report</small>
          )}
        </div>

        <div className="form-group">
          <label>Date Range (Optional)</label>
          <div className="date-range">
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                placeholder="Start Date"
              />
            </div>
            <span>to</span>
            <div className="date-input">
              <Calendar size={16} />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                placeholder="End Date"
              />
            </div>
          </div>
        </div>

        {reportType === 'worker' && (
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              <span>Include work notes in report</span>
            </label>
          </div>
        )}

        <div className="report-actions">
          <button 
            className="btn-primary"
            onClick={generateReport}
            disabled={loading || (reportType === 'worker' && !workerId)}
          >
            <Download size={18} />
            {loading ? 'Generating...' : 'Download PDF'}
          </button>

          {workerId && (
            <button 
              className="btn-secondary"
              onClick={shareReport}
              disabled={loading}
            >
              <Share2 size={18} />
              Share via WhatsApp
            </button>
          )}
        </div>
      </div>

      <div className="report-preview">
        <h4>Report Includes:</h4>
        <ul>
          <li>Worker information and contact details</li>
          <li>Work history with dates and earnings</li>
          <li>Summary statistics and totals</li>
          <li>Professional formatting suitable for printing</li>
          {includeNotes && <li>Additional work notes and comments</li>}
        </ul>
      </div>
    </div>
  );
};

export default ReportGenerator;