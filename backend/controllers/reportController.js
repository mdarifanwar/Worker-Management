const PDFDocument = require('pdfkit');
const Worker = require('../models/Worker');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Generate PDF report for a worker
exports.generateWorkerReport = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate, includeNotes } = req.query;

    const worker = await Worker.findOne({ 
      _id: workerId, 
      owner: req.user.id 
    }).populate('owner', 'companyName logo');

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Filter work history by date range if provided
    let workHistory = worker.workHistory;
    if (startDate && endDate) {
      workHistory = workHistory.filter(work => {
        const workDate = new Date(work.date);
        return workDate >= new Date(startDate) && workDate <= new Date(endDate);
      });
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${worker.name}-report-${Date.now()}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

   // Add company logo if available
   let logoY = 30;
   if (worker.owner.logo) {
     const logoPath = path.join(__dirname, '../uploads/', worker.owner.logo);
     console.log('Logo path:', logoPath, fs.existsSync(logoPath));
     if (fs.existsSync(logoPath)) {
       doc.image(logoPath, 60, logoY, { width: 40, height: 40 });
     } else {
       // Optionally, add a placeholder or skip logo
       doc.fontSize(10).fillColor('#888').text('No logo found', 60, logoY + 10);
     }
   }
   // Company name (blue) and worker name (black, bold)
   doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#2563eb')
     .text(`${worker.owner.companyName}'s`, 110, logoY + 5, { continued: true });
   doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#222')
     .text(worker.name, { continued: false });
   doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#666')
     .text('Work History Report', 110, logoY + 25);
   // Horizontal line
   doc.moveTo(50, logoY + 45).lineTo(550, logoY + 45).stroke();

    // Worker information section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('Worker Information:', 50, 120);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Name: ${worker.name}`, 50, 145);
    
    if (worker.phone) {
      doc.text(`Phone: ${worker.phone}`, 50, 160);
    }
    
    if (worker.email) {
      doc.text(`Email: ${worker.email}`, 50, 175);
    }
    
    if (worker.address) {
      doc.text(`Address: ${worker.address}`, 50, 190, { width: 500 });
    }

    // Summary statistics
    const totalEarnings = workHistory.reduce((sum, work) => sum + work.totalEarned, 0);
    const totalWorkDays = workHistory.length;
    const averageDailyEarnings = totalWorkDays > 0 ? totalEarnings / totalWorkDays : 0;

    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Summary:', 50, 230);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Total Work Days: ${totalWorkDays}`, 50, 255)
       .text(`Total Earnings: ₹${totalEarnings.toFixed(2)}`, 50, 270)
       .text(`Average Daily Earnings: ₹${averageDailyEarnings.toFixed(2)}`, 50, 285);

    // Work history table
    // Start from current doc.y so PDFKit's internal margins are respected
    let yPosition = doc.y || (logoY + 60);
    // Table header row with light gray background
    doc.rect(50, yPosition, 500, 22).fill('#f3f4f6');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#222');
    doc.text(new Date().toLocaleDateString(), 60, yPosition + 6);
    doc.text('Total:', 400, yPosition + 6, { align: 'right', width: 80 });
    doc.fillColor('#2563eb').font('Helvetica-Bold').text(`₹${totalEarnings.toFixed(2)}`, 480, yPosition + 6);
    yPosition += 22;
    // Table column headers
    doc.rect(50, yPosition, 500, 18).fill('#ededed');
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#222');
    doc.text('Item Name', 60, yPosition + 5);
    doc.text('Pieces', 220, yPosition + 5);
    doc.text('Rate', 320, yPosition + 5);
    doc.text('Total', 420, yPosition + 5);
    yPosition += 18;
    // Table rows: draw each work-day as its own table and avoid splitting a day's block across pages when possible
    const PAGE_BOTTOM_MARGIN = 40; // extra space to keep footer clear
    const PAGE_HEIGHT = doc.page.height;
    const PAGE_TOP_MARGIN = doc.page.margins && doc.page.margins.top ? doc.page.margins.top : 50;
    const rowHeight = 15;
    const dayHeaderHeight = 22;
    const colHeaderHeight = 18;

    const drawColHeader = (y) => {
      doc.rect(50, y, 500, colHeaderHeight).fill('#ededed');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#222');
      doc.text('Item Name', 60, y + 5);
      doc.text('Pieces', 220, y + 5);
      doc.text('Rate', 320, y + 5);
      doc.text('Total', 420, y + 5);
      return y + colHeaderHeight;
    };

    workHistory.forEach((work) => {
      const rows = (work.items || []).length;
      const required = dayHeaderHeight + colHeaderHeight + (rows * rowHeight) + 12; // padding

      // If the required block doesn't fit, start a new page
      if (yPosition + required > PAGE_HEIGHT - PAGE_BOTTOM_MARGIN) {
        doc.addPage();
        yPosition = doc.y || PAGE_TOP_MARGIN;
      }

      // Day header (date + total)
      doc.rect(50, yPosition, 500, dayHeaderHeight).fill('#f3f4f6');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#222');
      doc.text(new Date(work.date).toLocaleDateString(), 60, yPosition + 6);
      doc.text('Total:', 400, yPosition + 6, { align: 'right', width: 80 });
      doc.fillColor('#2563eb').font('Helvetica-Bold').text(`₹${(work.totalEarned||0).toFixed(2)}`, 480, yPosition + 6);
      yPosition += dayHeaderHeight;

      // Column headers
      yPosition = drawColHeader(yPosition);

      // Rows for this day
      (work.items || []).forEach((item) => {
        // If row would overflow page, add page and redraw column header
        if (yPosition + rowHeight > PAGE_HEIGHT - PAGE_BOTTOM_MARGIN) {
          doc.addPage();
          yPosition = doc.y || PAGE_TOP_MARGIN;
          yPosition = drawColHeader(yPosition);
        }

        doc.fontSize(9).font('Helvetica').fillColor('#222');
        doc.text(item.itemName || '-', 60, yPosition + 5);
        doc.text((item.piecesCompleted || 0).toString(), 220, yPosition + 5);
        const rate = (typeof item.wageRate === 'number') ? item.wageRate : (item.rate || 0);
        const total = (typeof item.totalWage === 'number') ? item.totalWage : (rate * (item.piecesCompleted || 0));
        doc.text(`₹${rate.toFixed(2)}`, 320, yPosition + 5);
        doc.text(`₹${total.toFixed(2)}`, 420, yPosition + 5);
        yPosition += rowHeight;
      });
      // small gap after each day
      yPosition += 8;
    });
    // Footer: draw on each page using pageAdded event and for the current page
    const drawFooter = () => {
      try {
        doc.fontSize(8)
           .fillColor('#666666')
           .text(
             `Generated on ${new Date().toLocaleDateString()}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      } catch (e) {
        // ignore footer drawing errors
      }
    };

    // Attach event so subsequent pages get a footer when added
    doc.on('pageAdded', () => drawFooter());

    // Draw footer on the current (last) page as well
    drawFooter();

    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
};

// Generate summary report for all workers
exports.generateSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const workers = await Worker.find({ owner: req.user.id })
                              .populate('owner', 'companyName logo')
                              .sort({ name: 1 });

    const user = await User.findById(req.user.id);
    const companyName = user && user.companyName ? user.companyName : 'Company';

    // Create PDF document
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${companyName}-summary-${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Add company logo if available
    let logoY = 50;
    if (user.logo) {
      const logoPath = path.join(__dirname, '../uploads/', user.logo);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, doc.page.width / 2 - 32, logoY, { width: 64, height: 64 });
        logoY += 70;
      }
    }

    // Add company name
    doc.fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(companyName, 50, logoY, { align: 'center' });

    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Workforce Summary Report', 50, logoY + 30, { align: 'center' });

    // Date range
    if (startDate && endDate) {
      doc.text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 
        50, logoY + 55, { align: 'center' });
    } else {
      doc.text('All Time Summary', 50, logoY + 55, { align: 'center' });
    }

    let yPosition = logoY + 100;

    // Worker summaries
    workers.forEach((worker, index) => {
      // Limit number of workers per page to avoid infinite recursion
      if (index > 0 && index % 7 === 0) {
        doc.addPage();
        yPosition = 50;
      }

      // Filter work history by date range
      let workHistory = worker.workHistory;
      if (startDate && endDate) {
        workHistory = workHistory.filter(work => {
          const workDate = new Date(work.date);
          return workDate >= new Date(startDate) && workDate <= new Date(endDate);
        });
      }

      const totalEarnings = workHistory.reduce((sum, work) => sum + work.totalEarned, 0);
      const totalWorkDays = workHistory.length;

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(worker.name, 50, yPosition);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(`Work Days: ${totalWorkDays} | Total Earned: ₹${totalEarnings.toFixed(2)}`, 
               50, yPosition + 20);
      
      // Recent work items
      const recentWork = workHistory.slice(-3).reverse();
      if (recentWork.length > 0) {
        recentWork.forEach((work, workIndex) => {
          doc.fontSize(8)
             .text(`${new Date(work.date).toLocaleDateString()}: ₹${work.totalEarned.toFixed(2)} - ${work.items.length} items`, 
                    70, yPosition + 35 + (workIndex * 12));
        });
      }

      yPosition += 80;
    });

    // Summary statistics
    const totalWorkers = workers.length;
    const totalCompanyEarnings = workers.reduce((sum, worker) => {
      let workHistory = worker.workHistory;
      if (startDate && endDate) {
        workHistory = workHistory.filter(work => {
          const workDate = new Date(work.date);
          return workDate >= new Date(startDate) && workDate <= new Date(endDate);
        });
      }
      return sum + workHistory.reduce((sum, work) => sum + work.totalEarned, 0);
    }, 0);

   doc.addPage();
   doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text('Overall Statistics', 50, 50);
    
   doc.fontSize(12)
     .font('Helvetica')
     .text(`Total Workers: ${totalWorkers}`, 50, 80)
     .text(`Total Company Payments: $${totalCompanyEarnings.toFixed(2)}`, 50, 100);

   // Footer: draw on each page using pageAdded event and for the current page
   const drawFooter = () => {
     try {
       doc.fontSize(8)
         .fillColor('#666666')
         .text(
           `Generated on ${new Date().toLocaleDateString()}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
     } catch (e) {
       // ignore footer errors
     }
   };

   doc.on('pageAdded', () => drawFooter());
   drawFooter();

   // Add error event handler to avoid unhandled stream errors
   doc.on('error', (err) => {
     console.error('PDF stream error:', err);
     // Do not write to response after doc.end()
   });

   doc.end();

  } catch (error) {
    console.error('Summary report error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating summary report', error: error.message });
    }
  }
};

// Share report via WhatsApp
exports.shareReport = async (req, res) => {
  try {
    const { workerId, message } = req.body;
    
    // In a real implementation, you would:
    // 1. Generate the report
    // 2. Upload to cloud storage
    // 3. Return a shareable link
    
    // For now, we'll return a success message
    res.json({
      message: 'Report shared successfully',
      shareableLink: `https://api.whatsapp.com/send?text=${encodeURIComponent(message || 'Check out this worker report')}`
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error sharing report', error: error.message });
  }
};

// Generate worker report using Puppeteer (server-side HTML rendering -> PDF)
exports.generateWorkerReportHtmlPdf = async (req, res) => {
  const puppeteer = require('puppeteer');
  try {
    const { workerId } = req.params;
    const worker = await Worker.findOne({ _id: workerId, owner: req.user.id }).populate('owner', 'companyName logo');
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    // Build printable HTML (similar to frontend)
    const companyName = worker.owner?.companyName || '';
    // Inline logo as data URL if available
    let logoData = '';
    try {
      if (worker.owner && worker.owner.logo) {
        const logoPath = path.join(__dirname, '../uploads/', worker.owner.logo);
        if (fs.existsSync(logoPath)) {
          const buf = fs.readFileSync(logoPath);
          const ext = path.extname(logoPath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          logoData = `data:${mime};base64,${buf.toString('base64')}`;
        }
      }
    } catch (e) {
      console.debug('Could not inline logo for puppeteer PDF', e && e.message);
    }

    const sorted = (worker.workHistory || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
    // Simple HTML template used for server-side rendering
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${companyName} - ${worker.name}</title>
      <style>
        @page { size: A4; margin: 12mm 8mm; }
        /* Page and typography (squeezed) */
        body{font-family:Arial,Helvetica,sans-serif;margin:12mm 8mm;color:#222;font-size:12px}
        .header{display:flex;gap:10px;align-items:center}
        .logo{width:64px;height:64px;border-radius:6px;object-fit:cover}
        .company{font-size:28px;color:#1565d8;font-weight:800}
        .subtitle{color:#666;font-size:11px}

        /* Prevent work-day blocks from being split across pages */
        .work-day{margin-top:18px; page-break-inside:avoid; break-inside:avoid; -webkit-column-break-inside:avoid}
        .work-day-header{background:#f3f4f6;padding:8px;border:1px solid #e6e6e6}

        /* Tables: allow header repetition and avoid row splits */
        table{width:100%;border-collapse:collapse;margin-top:8px; page-break-inside:auto}
        thead{display:table-header-group}
        tbody{display:table-row-group}
        tr{page-break-inside:avoid; break-inside:avoid}
        th{background:#fafafa;padding:6px;border:1px solid #e6e6e6;text-align:left;font-size:11px}
        td{padding:6px;border:1px solid #eee;font-size:10px}

        /* Footer should stay together */
        .footer{width:100%;text-align:center;color:#666;font-size:12px;margin-top:18px; page-break-inside:avoid}

        /* Fallbacks for older engines */
        @media print {
          .work-day, .work-day-header, tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
      </style>
    </head><body>
      <div class="header">
        ${logoData ? `<img src="${logoData}" class="logo"/>` : ''}
        <div>
          <div class="company">${companyName}</div>
          <div class="subtitle">Workforce Summary Report<br/><strong>All Time Summary</strong></div>
        </div>
      </div>
      <div style="margin-top:12px">${worker.name}<br/>Work Days: ${sorted.length} | Total Earned: ₹${(worker.totalEarnings||0).toFixed(2)}</div>
      ${sorted.map(w=>`<div class="work-day"><div class="work-day-header">${new Date(w.date).toLocaleDateString()} <span style="float:right;font-weight:700">Total: ₹${(w.totalEarned||0).toFixed(2)}</span></div>
        <table class="work-table" style="page-break-inside:avoid; break-inside:avoid; -webkit-column-break-inside:avoid; width:100%"><thead><tr><th>Item Name</th><th>Pieces</th><th>Rate</th><th>Total</th></tr></thead><tbody>
        ${ (w.items||[]).map(item=>`<tr style="page-break-inside:avoid; break-inside:avoid"><td>${item.itemName||'-'}</td><td style="text-align:right">${item.piecesCompleted||0}</td><td style="text-align:right">₹${((item.wageRate||item.rate)||0).toFixed(2)}</td><td style="text-align:right">₹${((item.totalWage)||(((item.wageRate||item.rate)||0)*(item.piecesCompleted||0))).toFixed(2)}</td></tr>`).join('')}
        </tbody></table></div>`).join('')}
      <div class="footer">Report generated on ${new Date().toLocaleDateString()}</div>
    </body></html>`;

    // Launch puppeteer and render PDF
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '12mm', right: '12mm' }, preferCSSPageSize: true });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${worker.name}-report-${Date.now()}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Puppeteer PDF error:', error);
    return res.status(500).json({ message: 'Error generating PDF via Puppeteer', error: error.message });
  }
};