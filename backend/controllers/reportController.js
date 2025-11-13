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
    let yPosition = logoY + 60;
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
    // Table rows
    workHistory.forEach((work, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      // For each item in work
      work.items.forEach(item => {
        doc.fontSize(9).font('Helvetica').fillColor('#222');
        doc.text(item.itemName, 60, yPosition + 5);
        doc.text(item.piecesCompleted.toString(), 220, yPosition + 5);
        doc.text(`₹${item.rate.toFixed(2)}`, 320, yPosition + 5);
        doc.text(`₹${(item.piecesCompleted * item.rate).toFixed(2)}`, 420, yPosition + 5);
        yPosition += 15;
      });
    });
    // Footer
    doc.fontSize(10).fillColor('#888').text(`Report generated on ${new Date().toLocaleDateString()}`, 50, yPosition + 30, { align: 'center' });

    // Footer
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .fillColor('#666666')
         .text(
          `Generated on ${new Date().toLocaleDateString()}`, 
          50, 
          doc.page.height - 50,
          { align: 'center' }
        );
    }

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

    // Create PDF document
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="${user.companyName}-summary-${Date.now()}.pdf"`
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
      .text(user.companyName, 50, logoY, { align: 'center' });

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

   // Footer (move after all content, before doc.end())
   // Add footer to all pages
   const totalPages = doc.bufferedPageRange().count;
   if (totalPages > 0) {
     for (let i = 0; i < totalPages; i++) {
       doc.switchToPage(i);
       doc.fontSize(8)
         .fillColor('#666666')
         .text(
           `Generated on ${new Date().toLocaleDateString()}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
     }
   }

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