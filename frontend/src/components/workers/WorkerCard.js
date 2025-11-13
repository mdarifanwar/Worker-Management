import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { workersAPI } from '../../services/api';
import { BACKEND_ORIGIN } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  User, 
  Phone, 
  Mail, 
  IndianRupee, 
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Send
} from 'lucide-react';
import jsPDF from 'jspdf';

const WorkerCard = ({ worker, onUpdate }) => {
  const handleSendWhatsApp = async () => {
    // Generate PDF with worker details
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    // Add logo if available and center it
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.logo) {
        const origin = BACKEND_ORIGIN || '';
        let logoUrl = user.logo.startsWith('http') ? user.logo : `${origin}/uploads/${user.logo}`;
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const imgWidth = 56, imgHeight = 56;
        const xImg = (pageWidth - imgWidth) / 2;
        doc.addImage(img, 'PNG', xImg, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      }
    } catch {}
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    // Center Worker Details title
    const title = 'Worker Details';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Name: ${worker.name}`, 20, y); y += 10;
    doc.text(`Phone: ${worker.phone}`, 20, y); y += 10;
    doc.text(`Email: ${worker.email || ''}`, 20, y); y += 10;
    doc.text(`Address: ${worker.address || ''}`, 20, y); y += 10;
    doc.text(`Work Days: ${worker.workHistory.length}`, 20, y); y += 15;
    // Center Total Earned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const totalText = `Total Earned: ₹${(worker.totalEarnings || 0).toFixed(2)}`;
    const totalWidth = doc.getTextWidth(totalText);
    doc.text(totalText, (pageWidth - totalWidth) / 2, y);

    // Save PDF as blob
    const pdfBlob = doc.output('blob');
    // WhatsApp Web API: https://wa.me/<number>?text=<message>
    // File upload is not supported via URL, so we send a message with a link or instructions
    const phone = worker.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent('Here are your worker details. PDF attached if supported.');
    const waUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(waUrl, '_blank');
    // Optionally, show instructions to user to manually attach the PDF if WhatsApp Web does not support direct file upload
    // Save PDF for user to attach manually
    doc.save(`${worker.name}_details.pdf`);
  };
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this worker?')) {
      return;
    }

    try {
      setLoading(true);
      await workersAPI.delete(worker._id);
      toast.success('Worker deleted successfully');
      onUpdate();
    } catch (error) {
      toast.error('Error deleting worker');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const lastWorkDate = worker.workHistory.length > 0 
    ? new Date(worker.workHistory[worker.workHistory.length - 1].date).toLocaleDateString()
    : 'No work recorded';

  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <div className="worker-avatar">
          <User size={24} />
        </div>
        <div className="worker-info">
          <h3>{worker.name}</h3>
          <p className="worker-meta">Last work: {lastWorkDate}</p>
        </div>
        <div className="worker-actions">
          <button 
            className="icon-btn"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={16} />
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <Link 
                to={`/worker/${worker._id}`}
                className="dropdown-item"
                onClick={() => setShowMenu(false)}
              >
                <Edit size={16} />
                View Details
              </Link>
              <button 
                className="dropdown-item delete"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 size={16} />
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="worker-details">
        {/* <div className="detail-item">
          <strong>Name:</strong> {worker.name}
        </div> */}
        {worker.phone && (
          <div className="detail-item">
            <Phone size={16} />
            <span><strong>Phone:</strong> {worker.phone}</span>
          </div>
        )}
        {worker.email && (
          <div className="detail-item">
            <Mail size={16} />
            <span><strong>Email:</strong> {worker.email}</span>
          </div>
        )}
        {worker.address && (
          <div className="detail-item">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin" viewBox="0 0 24 24"><path d="M12 21s-6-5.686-6-10A6 6 0 0 1 18 11c0 4.314-6 10-6 10Z"></path><circle cx="12" cy="11" r="2"></circle></svg>
              <strong>Address:</strong> {worker.address}
            </span>
          </div>
        )}
        <div className="detail-item">
          <Calendar size={16} />
          <span>{worker.workHistory.length} work days</span>
        </div>
        <div className="detail-item earnings">
          <IndianRupee size={16} />
          <span>Total: ₹{(worker.totalEarnings || 0).toFixed(2)}</span>
        </div>
      </div>

      <div className="worker-card-footer">
        <Link 
          to={`/worker/${worker._id}`}
          className="btn-secondary full-width"
        >
          View Details
        </Link>
        <button 
          className="btn-primary full-width" 
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={handleSendWhatsApp}
        >
          <Send size={16} /> Send PDF to WhatsApp
        </button>
      </div>
    </div>
  );
};

export default WorkerCard;