const express = require('express');
const { 
  generateWorkerReport, 
  generateSummaryReport, 
  shareReport 
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// Generate PDF report for specific worker
router.get('/worker/:workerId', generateWorkerReport);

// Generate summary report for all workers
router.get('/summary', generateSummaryReport);

// Share report via WhatsApp
router.post('/share', shareReport);

module.exports = router;