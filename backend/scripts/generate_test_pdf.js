/*
  Test script: generates a PDF for the first worker found in DB (or a workerId passed as first arg)
  Usage:
    node backend/scripts/generate_test_pdf.js [<workerId>]
*/

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');

const Worker = require('../models/Worker');
const User = require('../models/User');

(async () => {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-management';
    await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB at', mongoUrl);

    const workerId = process.argv[2];
    let worker;
    if (workerId) {
      worker = await Worker.findById(workerId).populate('owner', 'companyName logo');
    } else {
      worker = await Worker.findOne({}).populate('owner', 'companyName logo');
    }

    if (!worker) {
      console.error('No worker found in database. Create a worker or pass workerId as argument.');
      process.exit(1);
    }

    const puppeteer = require('puppeteer');

    // inline logo
    let logoData = '';
    try {
      if (worker.owner && worker.owner.logo) {
        const logoPath = path.join(__dirname, '..', 'uploads', worker.owner.logo);
        if (fs.existsSync(logoPath)) {
          const buf = fs.readFileSync(logoPath);
          const ext = path.extname(logoPath).toLowerCase().replace('.', '') || 'png';
          const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
          logoData = `data:${mime};base64,${buf.toString('base64')}`;
        }
      }
    } catch (e) {
      console.warn('Could not inline logo:', e.message || e);
    }

    const sorted = (worker.workHistory || []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));

    const companyName = worker.owner?.companyName || 'Company';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${companyName} - ${worker.name}</title>
      <style>
        @page { size: A4; margin: 12mm 8mm; }
        /* Squeezed page layout for denser content */
        body{font-family:Arial,Helvetica,sans-serif;margin:12mm 8mm;color:#222;font-size:12px}
        .header{display:flex;gap:10px;align-items:center}
        .logo{width:64px;height:64px;border-radius:6px;object-fit:cover}
        .company{font-size:28px;color:#1565d8;font-weight:800}
        .subtitle{color:#666;font-size:11px}
        .work-day{margin-top:14px; page-break-inside:avoid; break-inside:avoid; -webkit-column-break-inside:avoid}
        .work-day-header{background:#f3f4f6;padding:8px;border:1px solid #e6e6e6}
        table{width:100%;border-collapse:collapse;margin-top:6px; page-break-inside:auto}
        thead{display:table-header-group}
        tbody{display:table-row-group}
        tr{page-break-inside:avoid; break-inside:avoid}
        th{background:#fafafa;padding:6px;border:1px solid #e6e6e6;text-align:left;font-size:11px}
        td{padding:6px;border:1px solid #eee;font-size:10px}
        .footer{width:100%;text-align:center;color:#666;font-size:11px;margin-top:12px; page-break-inside:avoid}
        @media print { .work-day, .work-day-header, tr { page-break-inside: avoid; } thead { display: table-header-group; } }
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
      ${sorted.map(w=>`<div class="day-wrapper"><div class="work-day"><div class="work-day-header">${new Date(w.date).toLocaleDateString()} <span style="float:right;font-weight:700">Total: ₹${(w.totalEarned||0).toFixed(2)}</span></div>
        <table class="work-table" style="page-break-inside:avoid; break-inside:avoid; -webkit-column-break-inside:avoid; width:100%"><thead><tr><th>Item Name</th><th>Pieces</th><th>Rate</th><th>Total</th></tr></thead><tbody>
        ${ (w.items||[]).map(item=>`<tr style="page-break-inside:avoid; break-inside:avoid"><td>${item.itemName||'-'}</td><td style="text-align:right">${item.piecesCompleted||0}</td><td style="text-align:right">₹${((item.wageRate||item.rate)||0).toFixed(2)}</td><td style="text-align:right">₹${((item.totalWage)||(((item.wageRate||item.rate)||0)*(item.piecesCompleted||0))).toFixed(2)}</td></tr>`).join('')}
        </tbody></table></div></div>`).join('')}
      <div class="footer">Report generated on ${new Date().toLocaleDateString()}</div>
    </body></html>`;

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = path.join(__dirname, '..', 'test-worker-report.pdf');
    await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '8mm', right: '8mm' }, preferCSSPageSize: true });
    await browser.close();
    console.log('Wrote PDF to', outPath);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error generating test PDF:', err);
    try { await mongoose.disconnect(); } catch(e){}
    process.exit(1);
  }
})();
