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

router.use(auth);

router.post('/', addWorker);
router.get('/', getWorkers);
router.get('/:id', getWorkerById);
router.post('/:id/work', addDailyWork);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;