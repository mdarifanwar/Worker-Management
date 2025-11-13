const Worker = require('../models/Worker');

exports.addWorker = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    const worker = new Worker({
      name,
      phone,
      email,
      address,
      owner: req.user.id
    });

    await worker.save();
    
    res.status(201).json({
      message: 'Worker added successfully',
      worker
    });
  } catch (error) {
    console.error('[addWorker] Error:', error);
    res.status(500).json({ message: 'Error adding worker', error: error.message });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    let query = { owner: req.user.id, isActive: true };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const workers = await Worker.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Worker.countDocuments(query);

    res.json({
      workers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('[getWorkers] Error:', error);
    res.status(500).json({ message: 'Error fetching workers', error: error.message });
  }
};

exports.getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching worker', error: error.message });
  }
};

exports.addDailyWork = async (req, res) => {
  try {
    const { date, items, notes } = req.body;
    
    const worker = await Worker.findOne({ 
      _id: req.params.id, 
      owner: req.user.id 
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Calculate totals for each item
    const workItems = items.map(item => ({
      itemName: item.itemName,
      wageRate: item.wageRate,
      piecesCompleted: item.piecesCompleted
    }));

    const dailyWork = {
      date: date || new Date(),
      items: workItems,
      notes: notes || ''
    };

    worker.workHistory.push(dailyWork);
    await worker.save();

    res.json({
      message: 'Daily work added successfully',
      worker: worker
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding daily work', error: error.message });
  }
};

exports.updateWorker = async (req, res) => {
  try {
    const { name, phone, email, address, isActive } = req.body;
    
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name, phone, email, address, isActive },
      { new: true, runValidators: true }
    );

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({
      message: 'Worker updated successfully',
      worker
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating worker', error: error.message });
  }
};

exports.deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting worker', error: error.message });
  }
};