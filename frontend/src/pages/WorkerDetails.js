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

    const nowStamp = format(new Date(), 'dd/MM/yyyy, HH:mm');
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${companyName || worker.name} - Work History Report</title>
            <style>
            /* Professional, print-friendly styles matching the provided sample */
            html,body { height: 100%; }
            body {
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
              margin: 18mm 12mm;
              color: #222;
              background: #fff;
              -webkit-print-color-adjust: exact;
            }

            .page-top { display:flex; justify-content:space-between; align-items:flex-start; }
            .top-left { font-size:10px; color:#666; }
            .header-row { display:flex; align-items:center; gap:14px; margin-top:6px; }
            .logo-left { width:80px; height:80px; object-fit:cover; border-radius:8px; }
            .brand { display:flex; flex-direction:column; }
            .company-name { font-size:32px; letter-spacing:0.5px; font-weight:900; color:#1565d8; margin:0; }
            .subtitle { font-size:13px; color:#666; margin-top:4px; }

            .worker-title { margin-top:6px; font-size:14px; color:#222; font-weight:700; }

            .worker-block { margin: 18px 0; page-break-inside: avoid; }
            .work-day { margin-top:14px; }

            .work-day-header { display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px 12px; border:1px solid #e6eef8; border-radius:2px; }
            .work-table { width:100%; border-collapse:collapse; margin-top:8px; }
            .work-table th { background:#f1f5f9; padding:10px; text-align:left; border:1px solid #e6eef8; font-weight:700; }
            .work-table td { padding:10px; border:1px solid #eef4f8; font-size:13px; }

            .footer-line { width:100%; border-top:1px solid #eee; padding-top:8px; font-size:12px; color:#666; text-align:center; margin-top:18px; }

            @media print { body { margin: 12mm 8mm; } .worker-block { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="page-top">
            <div class="top-left">${nowStamp}</div>
            <div style="flex:1"></div>
            <div style="width:80px"></div>
          </div>
          <div class="header-row">
            ${logo ? `<img src="${logo}" alt="Company Logo" class="logo-left company-logo" />` : ''}
            <div class="brand">
              ${companyName ? `<div class="company-name">${companyName}</div>` : ''}
              <div class="subtitle">Workforce Summary Report<br/><span style="font-weight:600">All Time Summary</span></div>
            </div>
          </div>

          <div class="content">
            <div class="worker-block">
              <div class="worker-name">${worker.name}</div>
              <div class="worker-stats">Work Days: ${worker.workHistory.length} | Total Earned: ₹${(worker.totalEarnings || 0).toFixed(2)}</div>
            </div>

            ${sortedWorkHistory.map(workDay => `
              <div class="work-day" style="margin-top:18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;background:#f3f4f6;padding:10px;border:1px solid #e6e6e6;">
                  <div style="font-weight:700">${format(new Date(workDay.date), 'MMMM dd, yyyy')}</div>
                  <div style="font-weight:700">Total: ₹${(workDay.totalEarned || 0).toFixed(2)}</div>
                </div>
                <table class="work-table" style="width:100%;border-collapse:collapse;border:1px solid #e6e6e6;margin-top:6px;">
                  <thead>
                    <tr style="background:#fafafa;border-bottom:1px solid #e6e6e6;">
                      <th style="text-align:left;padding:8px;border-right:1px solid #e6e6e6;font-weight:700;">Item Name</th>
                      <th style="text-align:right;padding:8px;border-right:1px solid #e6e6e6;font-weight:700;">Pieces</th>
                      <th style="text-align:right;padding:8px;border-right:1px solid #e6e6e6;font-weight:700;">Rate</th>
                      <th style="text-align:right;padding:8px;font-weight:700;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${workDay.items.map(item => `
                      <tr>
                        <td style="padding:8px;border-top:1px solid #eee;border-right:1px solid #eee;">${item.itemName || '-'}</td>
                        <td style="padding:8px;border-top:1px solid #eee;border-right:1px solid #eee;text-align:right;">${item.piecesCompleted || 0}</td>
                        <td style="padding:8px;border-top:1px solid #eee;border-right:1px solid #eee;text-align:right;">₹${(item.wageRate || item.rate || 0).toFixed(2)}</td>
                        <td style="padding:8px;border-top:1px solid #eee;text-align:right;">₹${(item.totalWage || ((item.wageRate || item.rate || 0) * (item.piecesCompleted || 0))).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>

          <div class="footer-line">Report generated on ${format(new Date(), 'MMMM dd, yyyy')}</div>
        </body>
      </html>
    `;
  };

  // Robust helper to obtain a logo as a data URL. Tries multiple fetch strategies
  // and falls back to loading the image into a canvas when possible.
  const fetchLogoDataUrl = async (url) => {
    if (!url) return { dataUrl: null, method: null };
    try {
      if (url.startsWith('data:')) return { dataUrl: url, method: 'data-url' };
    } catch (e) {}

    const tryBlobFetch = async (input, opts = {}) => {
      try {
        console.debug('[logo] tryBlobFetch', input, opts);
        const resp = await fetch(input, opts);
        if (!resp.ok) {
          console.debug('[logo] tryBlobFetch failed status', resp.status, input);
          return null;
        }
        const blob = await resp.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.debug('[logo] tryBlobFetch exception', e && e.message);
        return null;
      }
    };

    // Try fetch with credentials (if backend requires cookies)
    let dataUrl = await tryBlobFetch(url, { credentials: 'include' });
    if (dataUrl) return { dataUrl, method: 'fetch-credentials' };

    // Try simple fetch without credentials
    dataUrl = await tryBlobFetch(url, {});
    if (dataUrl) return { dataUrl, method: 'fetch' };

    // Try backend proxy (same-origin) using filename if available
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      if (filename) {
        const proxyUrl = `${BACKEND_ORIGIN}/api/assets/logo-base64?path=${encodeURIComponent(filename)}`;
        console.debug('[logo] trying proxy', proxyUrl);
        const resp = await fetch(proxyUrl, { credentials: 'include' });
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.data) return { dataUrl: json.data, method: 'proxy' };
        } else {
          console.debug('[logo] proxy failed', resp.status, proxyUrl);
        }
      }
    } catch (e) {
      console.debug('[logo] proxy exception', e && e.message);
      // ignore proxy errors
    }

    // Last resort: try to load the image via Image() and draw to canvas
    try {
      console.debug('[logo] trying image->canvas fallback', url);
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        // attempt crossOrigin anonymous; may fail if server doesn't permit
        i.crossOrigin = 'Anonymous';
        i.onload = () => resolve(i);
        i.onerror = (err) => reject(err);
        i.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const result = canvas.toDataURL('image/png');
      return { dataUrl: result, method: 'canvas-fallback' };
    } catch (e) {
      console.debug('[logo] canvas fallback failed', e && e.message);
      return { dataUrl: null, method: null };
    }
  };

  const generatePdf = async () => {
    if (!worker) {
      toast.error("No worker data available.");
      return null;
    }

    try {
      // Inline logo as data URL (robust fetch is done by fetchLogoDataUrl)

      // Determine logo URL (same logic as in generatePrintableHTML)
      let logoUrl = '';
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.logo) {
          const origin = BACKEND_ORIGIN || '';
          logoUrl = user.logo.startsWith('http') ? user.logo : `${origin}/uploads/${user.logo}`;
        }
      } catch (e) {}

      const { dataUrl: logoDataUrl, method: logoMethod } = await fetchLogoDataUrl(logoUrl);
      console.debug('[generatePdf] logo fetch method:', logoMethod, 'logoDataUrl present:', !!logoDataUrl);

      // Create a temporary iframe for PDF generation. Use A4 pixel width for consistent rendering.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-10000px';
      iframe.style.top = '0';
      // A4 at 96dpi: 210mm * 96 / 25.4 = ~794px
      const A4_PX_WIDTH = Math.round(210 * 96 / 25.4);
      iframe.style.width = `${A4_PX_WIDTH}px`;
      // set a large height; we'll clip via html2canvas
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const htmlContent = generatePrintableHTML();
      // If we were able to fetch inline logo data URL, replace the logo src with the data URL
      let finalHtml = htmlContent;
      if (logoDataUrl) {
        // Replace any img that has either company-logo or logo-left in its class attribute
        finalHtml = htmlContent.replace(/(<img[^>]*class=\"[^\"]*(?:company-logo|logo-left)[^\"]*\"[^>]*src=\")(.*?)(\"[^>]*>)/i, `$1${logoDataUrl}$3`);
      }
      iframe.contentDocument.open();
      iframe.contentDocument.write(finalHtml);
      iframe.contentDocument.close();
      // ensure body width matches A4 pixel width so css lays out correctly
      try { iframe.contentDocument.body.style.width = `${A4_PX_WIDTH}px`; } catch(e) {}

      // If we have an inlined logo data URL, set it directly on the image element inside the iframe
      try {
          if (logoDataUrl) {
            const doc = iframe.contentDocument;
            const imgEl = doc.querySelector && (doc.querySelector('.company-logo') || doc.querySelector('.logo-left'));
            if (imgEl) {
              try {
                imgEl.src = logoDataUrl;
                // If the image is already cached/complete, make it visible immediately.
                // Otherwise hide until onload fires to avoid rendering incomplete image.
                try {
                  if (imgEl.complete) {
                    imgEl.style.visibility = 'visible';
                  } else {
                    imgEl.style.visibility = 'hidden';
                    imgEl.onload = () => { imgEl.style.visibility = 'visible'; };
                  }
                  imgEl.onerror = () => { imgEl.style.display = 'none'; };
                } catch (e) {
                  // best-effort: ensure visible in case of unexpected DOM restrictions
                  try { imgEl.style.visibility = 'visible'; } catch(_){}
                }
                // remove crossorigin attr which may interfere after setting data URL
                try { imgEl.removeAttribute('crossorigin'); } catch(e){}
              } catch(e) {
                // fallback: set visibility visible if assignment fails silently
                try { imgEl.style.visibility = 'visible'; } catch(_){ }
              }
            }
          }
      } catch (e) {
        // ignore DOM access errors
      }

      // Wait for content and all images inside iframe to load
      // Wait for content and all images inside iframe to load (longer timeout for logo fetching)
      await new Promise(resolve => {
        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;
        let images = Array.from(doc.images || []);
        if (images.length === 0) {
          // wait for window load
          win.onload = resolve;
          iframe.onload = resolve;
          // safety timeout
          setTimeout(resolve, 800);
          return;
        }

        let loaded = 0;
        const check = () => {
          loaded += 1;
          if (loaded >= images.length) resolve();
        };
        images.forEach(img => {
          try {
            if (img.complete) return check();
            img.onload = check;
            img.onerror = check;
          } catch (e) {
            check();
          }
        });
        // Fallback safety
        setTimeout(resolve, 5000);
      });

      // Paginated rendering: render the document in page-sized slices instead of one huge canvas.
      const body = iframe.contentDocument.body;
      const totalHeight = body.scrollHeight;
      const totalWidth = body.scrollWidth;

      // Choose scale dynamically: use a lower scale for very tall documents to avoid huge canvases
      const scale = totalHeight > 4000 ? 1 : 2;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Account for the printable margins defined in generatePrintableHTML (body { margin: 18mm 12mm; })
      const topMarginMm = 18;
      const bottomMarginMm = 18;
      const leftMarginMm = 12;
      const rightMarginMm = 12;

      // Reserve some space (mm) at bottom of each PDF page for footer / page numbers
      const footerReserveMm = 18; // mm (slightly larger to be safe)

      // Compute usable content dimensions in mm inside the PDF page
      const contentPdfWidthMm = Math.max(pdfWidth - leftMarginMm - rightMarginMm, pdfWidth * 0.6);
      const contentPdfHeightMm = Math.max(pdfHeight - topMarginMm - bottomMarginMm - footerReserveMm, pdfHeight * 0.6);

      // Calculate CSS px per mm for the current rendered width (based on content width)
      const cssPxPerMm = totalWidth / contentPdfWidthMm; // CSS pixels per mm
      // Page height in CSS pixels (for the printable area)
      const pageHeightPx = Math.floor(contentPdfHeightMm * cssPxPerMm);

      // Render each page slice via html2canvas using the clipping options (x,y,width,height)
      let position = 0;
      let pageIndex = 0;

      // Row-aware pagination: measure work-day blocks and table rows and create page ranges
      const overlapMm = 6; // small visual padding in mm between slices
      const overlapPx = Math.ceil(overlapMm * cssPxPerMm);

      // Collect important elements that should not be split: .work-day and table rows
      const visualItems = Array.from(body.querySelectorAll('.work-day, .work-table tbody tr'));
      visualItems.sort((a, b) => (a.offsetTop || 0) - (b.offsetTop || 0));

      const pageRanges = [];
      let currentStart = 0;

      for (let i = 0; i < visualItems.length; i++) {
        const el = visualItems[i];
        const elTop = el.offsetTop || 0;
        const elBottom = elTop + (el.offsetHeight || 0);

        // If this element would overflow the current page, break before it
        if (elBottom - currentStart > pageHeightPx) {
          // end current page just before this element, leave a tiny padding
          const endPos = Math.max(currentStart + pageHeightPx, elTop);
          pageRanges.push({ start: currentStart, end: endPos });
          currentStart = elTop;
        }
      }

      // Push final range
      if (currentStart < totalHeight) pageRanges.push({ start: currentStart, end: totalHeight });

      // Fallback if no visualItems found (e.g., very simple page) — split by fixed pages
      if (pageRanges.length === 0) {
        let pos = 0;
        while (pos < totalHeight) {
          const h = Math.min(pageHeightPx, totalHeight - pos);
          pageRanges.push({ start: pos, end: pos + h });
          pos += h;
        }
      }

      // Render each computed page range
      for (const range of pageRanges) {
        const start = Math.max(0, Math.floor(range.start - overlapPx / 2));
        const end = Math.min(totalHeight, Math.ceil(range.end + overlapPx / 2));
        const renderHeight = Math.max(1, end - start);

        const sliceCanvas = await html2canvas(body, {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: totalWidth,
          height: Math.ceil(renderHeight),
          x: 0,
          y: Math.floor(start),
          windowWidth: totalWidth,
          windowHeight: Math.ceil(renderHeight)
        });

        try {
          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceHeightMm = (sliceCanvas.height / scale) / cssPxPerMm;

          if (pageIndex > 0) pdf.addPage();
          const imgX = leftMarginMm;
          const imgY = topMarginMm;
          const imgW = contentPdfWidthMm;
          pdf.addImage(sliceData, 'PNG', imgX, imgY, imgW, sliceHeightMm);

          // Draw centered footer
          const footerText = `Report generated on ${format(new Date(), 'MMMM dd, yyyy')}`;
          pdf.setFontSize(10);
          pdf.setTextColor(120);
          pdf.text(footerText, pdfWidth / 2, pdfHeight - 8, { align: 'center' });
        } catch (err) {
          console.debug('Error adding slice to PDF:', err);
        }

        pageIndex += 1;
      }

      // Remove iframe now that we have built the PDF
      try { document.body.removeChild(iframe); } catch(e) {}

      // Add page numbers (Page X of Y) at bottom-right
      try {
        let pageCount = 1;
        if (typeof pdf.getNumberOfPages === 'function') pageCount = pdf.getNumberOfPages();
        else if (pdf.internal && pdf.internal.getNumberOfPages) pageCount = pdf.internal.getNumberOfPages();
        else if (pdf.internal && pdf.internal.pages) pageCount = pdf.internal.pages.length - 1;

        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          const w = pdf.internal.pageSize.getWidth();
          const h = pdf.internal.pageSize.getHeight();
          pdf.setFontSize(10);
          pdf.setTextColor(120);
          pdf.text(`Page ${i} of ${pageCount}`, w - 12, h - 8, { align: 'right' });
        }
      } catch (e) {
        // ignore page-numbering errors
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
      return null;
    }
  };

  const handlePrint = async () => {
    if (!worker) return;

    // Determine logo URL like other places
    let logoUrl = '';
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.logo) {
        const origin = BACKEND_ORIGIN || '';
        logoUrl = user.logo.startsWith('http') ? user.logo : `${origin}/uploads/${user.logo}`;
      }
    } catch (e) {}

    const { dataUrl: logoDataUrl, method: logoMethod } = await fetchLogoDataUrl(logoUrl);
    console.debug('[handlePrint] logo fetch method:', logoMethod, 'logoDataUrl present:', !!logoDataUrl);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let htmlContent = generatePrintableHTML();
    if (logoDataUrl) {
      htmlContent = htmlContent.replace(/(<img[^>]*class=\"[^\"]*(?:company-logo|logo-left)[^\"]*\"[^>]*src=\")(.*?)(\"[^>]*>)/i, `$1${logoDataUrl}$3`);
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    // match iframe rendering: set A4 pixel width for print window to get same layout
    try {
      const A4_PX_WIDTH = Math.round(210 * 96 / 25.4);
      printWindow.document.body.style.width = `${A4_PX_WIDTH}px`;
    } catch (e) {}

    // If image exists in print window, ensure it becomes visible when loaded
    try {
      const imgEl = printWindow.document.querySelector && (printWindow.document.querySelector('.company-logo') || printWindow.document.querySelector('.logo-left'));
      if (imgEl) {
        if (logoDataUrl) imgEl.src = logoDataUrl;
        else if (logoUrl) imgEl.src = logoUrl;
        // show when loaded
        imgEl.onload = () => { try { imgEl.style.visibility = 'visible'; } catch(e){} };
        imgEl.onerror = () => { try { imgEl.style.display = 'none'; } catch(e){} };
        try { imgEl.removeAttribute('crossorigin'); } catch(e){}
      }
    } catch (e) {
      // ignore
    }

    // Wait for images to load in the new window before calling print
    try {
      const doc = printWindow.document;
      const images = Array.from(doc.images || []);
      if (images.length === 0) {
        printWindow.onload = () => printWindow.print();
        setTimeout(() => { try { printWindow.print(); } catch(e){} }, 800);
        return;
      }

      await new Promise((resolve) => {
        let loaded = 0;
        const check = () => {
          loaded += 1;
          if (loaded >= images.length) resolve();
        };
        images.forEach(img => {
          if (img.complete) return check();
          img.onload = check;
          img.onerror = check;
        });
        setTimeout(resolve, 1500);
      });
      printWindow.print();
    } catch (e) {
      // fallback
      try { printWindow.print(); } catch (err) {}
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

      let pdfBlob;
      try {
        // preferred: jsPDF output('blob')
        pdfBlob = pdf.output('blob');
      } catch (e) {
        // fallback: arraybuffer -> Blob
        try {
          const ab = pdf.output('arraybuffer');
          pdfBlob = new Blob([ab], { type: 'application/pdf' });
        } catch (err) {
          console.error('Could not generate PDF blob:', err);
          toast.error('Could not prepare PDF to share.');
          return;
        }
      }
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