import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { workersAPI, BACKEND_ORIGIN } from '../services/api';
import WorkerForm from '../components/workers/WorkerForm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { IndianRupee, ArrowLeft, Plus, Printer, Download, Share2, User } from 'lucide-react';

const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const response = await workersAPI.getById(id);
        setWorker(response.data);
      } catch (error) {
        console.error("Error fetching worker:", error);
        toast.error('Error fetching worker details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, [id, navigate]);

  const generatePrintableHTML = () => {
    if (!worker) return '';

    // Get company info from localStorage
    let companyName = '';
    let logo = '';
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      companyName = user?.companyName || '';
      if (user?.logo) {
        const origin = BACKEND_ORIGIN || '';
        logo = user.logo.startsWith('http') ? user.logo : `${origin}/uploads/${user.logo}`;
      }
    } catch {}

    const sortedWorkHistory = [...worker.workHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${worker.name} - Work History Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              justify-content: flex-start;
              gap: 1.2rem;
            }
            .company-logo {
              width: 56px;
              height: 56px;
              object-fit: cover;
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(15,98,254,0.10);
              margin-right: 0.5rem;
            }
            .company-name {
              font-size: 1.35rem;
              font-weight: 700;
              color: #2563eb;
              margin-bottom: 0;
              margin-right: 1.2rem;
            }
            .header-content {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0.2rem;
            }
            .header-content h1 {
              margin: 0;
              font-size: 1.25rem;
              color: #222;
              font-weight: 700;
            }
            .header-content h2 {
              margin: 0;
              font-size: 1.05rem;
              color: #666;
              font-weight: 500;
            }
            .work-day {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .work-day-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background-color: #f5f5f5;
              padding: 10px 15px;
              border: 1px solid #ddd;
              border-bottom: none;
            }
            .work-day-date {
              font-size: 16px;
              font-weight: bold;
            }
            .work-day-total {
              font-size: 16px;
              font-weight: bold;
              color: #000;
            }
            .work-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #ddd;
            }
            .work-table th {
              background-color: #f8f8f8;
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            .work-table td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              font-size: 14px;
            }
            .total-section {
              margin-top: 10px;
              text-align: right;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              position: fixed;
              left: 0;
              bottom: 0;
              width: 100%;
              background: #fff;
              text-align: center;
              padding: 12px 0 8px 0;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
              z-index: 100;
            }
            @media print {
              body { margin: 0; }
              .work-day { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logo ? `<img src="${logo}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'" />` : ''}
            ${companyName ? `<span class="company-name">${companyName}</span>` : ''}
            <div class="header-content">
              <h1>${worker.name}</h1>
              <h2>Work History Report</h2>
            </div>
          </div>

          ${sortedWorkHistory.map(workDay => `
            <div class="work-day">
              <div class="work-day-header">
                <span class="work-day-date">${format(new Date(workDay.date), 'MMMM dd, yyyy')}</span>
                <span class="work-day-total">Total: ₹${workDay.totalEarned.toFixed(2)}</span>
              </div>
              <table class="work-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Pieces</th>
                    <th>Rate</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${workDay.items.map(item => `
                    <tr>
                      <td>${item.itemName}</td>
                      <td>${item.piecesCompleted}</td>
                      <td>₹${item.wageRate.toFixed(2)}</td>
                      <td>₹${item.totalWage.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}

          <div class="footer">
            Report generated on ${format(new Date(), 'MMMM dd, yyyy')}
          </div>
        </body>
      </html>
    `;
  };

  const generatePdf = async () => {
    if (!worker) {
      toast.error("No worker data available.");
      return null;
    }

    try {
      // Create a temporary iframe for PDF generation
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const htmlContent = generatePrintableHTML();
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();

      // Wait for content to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        iframe.contentWindow.onload = resolve;
      });

      const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: iframe.contentDocument.body.scrollHeight,
        windowWidth: 794,
        windowHeight: iframe.contentDocument.body.scrollHeight
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      let width = pdfWidth;
      let height = width / ratio;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
      return null;
    }
  };

  const handlePrint = () => {
    if (!worker) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = generatePrintableHTML();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownloadPdf = async () => {
    if (!worker) return;
    
    setGeneratingPdf(true);
    try {
      const pdf = await generatePdf();
      if (pdf) {
        pdf.save(`${worker.name}_work_history.pdf`);
        toast.success('PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error downloading PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    if (!worker) return;
    
    setGeneratingPdf(true);
    try {
      const pdf = await generatePdf();
      if (!pdf) return;

      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `${worker.name}_work_history.pdf`, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${worker.name}'s Work History`,
            text: `Work history report for ${worker.name}`,
          });
          toast.success('Work history shared successfully!');
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error sharing:', error);
            toast.error('Could not share the file.');
          }
        }
      } else {
        toast.info('Web Share not supported. Downloading PDF instead.');
        handleDownloadPdf();
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      toast.error('Error sharing PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleWorkAdded = () => {
    setShowWorkForm(false);
    setLoading(true);
    workersAPI.getById(id).then(response => {
      setWorker(response.data);
    }).catch(error => {
      console.error("Error refetching worker:", error);
      toast.error('Error refreshing worker details.');
    }).finally(() => {
      setLoading(false);
    });
  };

  if (loading) {
    return <div className="loading">Loading worker details...</div>;
  }

  if (!worker) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <h1>Worker Not Found</h1>
        </div>
        <div className="error">Could not load worker data. Please go back and try again.</div>
      </div>
    );
  }

  const averageDaily = worker.workHistory.length > 0 
    ? ((worker.totalEarnings || 0) / worker.workHistory.length)
    : 0;

  const sortedWorkHistory = worker.workHistory 
    ? [...worker.workHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  return (
    <div className="page-container">
      <div className="page-header page-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-actions-mobile" style={{ display: 'flex', alignItems: 'center' }}>
          <span className="header-actions-gap" />
          <button className="back-btn" onClick={() => navigate(-1)} title="Go Back">
            <ArrowLeft size={28} style={{ color: '#0f62fe', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(15,98,254,0.10)', padding: '4px' }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-primary"
            onClick={() => setShowWorkForm(true)}
            style={{ minWidth: '120px' }}
          >
            <Plus size={20} />
            Add Work
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowEditForm(true)}
          >
            Edit Worker
          </button>
        </div>
      </div>

      <div className="details-header-card">
        <div className="details-header-top">
          <div className="details-worker-info">
            <h1>{worker.name}</h1>
            <p>{worker.phone || 'No phone number'}</p>
          </div>
        </div>
        <div className="details-stats-grid">
          <div className="details-stat-item">
            <label>Total Earned</label>
            <span className="value positive">
              <IndianRupee size={18} />
              {(worker.totalEarnings || 0).toFixed(2)}
            </span>
          </div>
          <div className="details-stat-item">
            <label>Work Days</label>
            <span className="value">{worker.workHistory.length}</span>
          </div>
          <div className="details-stat-item">
            <label>Last Work Date</label>
            <span className="value">
              {sortedWorkHistory.length > 0 
                ? format(new Date(sortedWorkHistory[0].date), 'MMM dd, yyyy')
                : 'N/A'
              }
            </span>
          </div>
          <div className="details-stat-item">
            <label>Average Daily</label>
            <span className="value">
              <IndianRupee size={18} />
              {averageDaily.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="work-history-section">
        <div className="section-header">
          <h3>Work History</h3>
          <div className="history-actions">
            <button 
              className="icon-btn" 
              onClick={handlePrint} 
              title="Print History"
              disabled={generatingPdf || worker.workHistory.length === 0}
            >
              <Printer size={18} />
            </button>
            <button 
              className="icon-btn" 
              onClick={handleDownloadPdf} 
              title="Download as PDF"
              disabled={generatingPdf || worker.workHistory.length === 0}
            >
              <Download size={18} />
            </button>
            <button 
              className="icon-btn" 
              onClick={handleShare} 
              title="Share History"
              disabled={generatingPdf || worker.workHistory.length === 0}
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {worker.workHistory.length === 0 ? (
          <div className="empty-state">
            <User size={48} className="empty-icon" />
            <h4>No work history</h4>
            <p>Add work records to track earnings</p>
          </div>
        ) : (
          <div className="work-history-list">
            {sortedWorkHistory.map((workDay) => (
              <div key={workDay._id} className="work-day-card">
                <div className="work-day-header">
                  <h4>{format(new Date(workDay.date), 'MMM dd, yyyy')}</h4>
                  <span className="total-earned">
                    <IndianRupee size={14} /> {workDay.totalEarned.toFixed(2)}
                  </span>
                </div>
                <div className="work-items">
                  {workDay.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="work-item">
                      <span className="item-name">{item.itemName}</span>
                      <div className="item-details">
                        <span>{item.piecesCompleted} pcs</span>
                        <span>@ ₹{item.wageRate}/pc</span>
                        <span className="item-total">
                          <IndianRupee size={12} /> {item.totalWage.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWorkForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <WorkerForm
              workerId={id}
              onSuccess={handleWorkAdded}
              onCancel={() => setShowWorkForm(false)}
            />
          </div>
        </div>
      )}
      {showEditForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <WorkerForm
              workerId={id}
              onSuccess={() => { setShowEditForm(false); handleWorkAdded(); }}
              onCancel={() => setShowEditForm(false)}
              editMode={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDetails;