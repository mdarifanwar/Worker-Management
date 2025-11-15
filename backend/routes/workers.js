const express = require('express');
const {
  addWorker,
  getWorkers,
  getWorkerById,
  addDailyWork,
  updateWorker,
  deleteWorker
} = require('../controllers/workerController');
const auth = require('../middleware/auth');

const router = express.Router();

// Test endpoint to check if cookies are being sent (before auth middleware)
router.get('/test-auth', (req, res) => {
  res.json({
    message: 'Test endpoint reached',
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      authorization: req.headers.authorization
    }
  });
});

router.use(auth);

router.post('/', addWorker);
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/:id/work', addDailyWork);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;