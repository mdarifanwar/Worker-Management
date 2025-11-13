const mongoose = require('mongoose');

const workItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  wageRate: {
    type: Number,
    required: true,
    min: 0
  },
  piecesCompleted: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalWage: {
    type: Number,
    default: 0
  }
});

workItemSchema.pre('save', function(next) {
  this.totalWage = this.wageRate * this.piecesCompleted;
  next();
});

const dailyWorkSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [workItemSchema],
  totalEarned: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
});

dailyWorkSchema.pre('save', function(next) {
  this.totalEarned = this.items.reduce((total, item) => total + item.totalWage, 0);
  next();
});

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  workHistory: [dailyWorkSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate total lifetime earnings
workerSchema.virtual('totalEarnings').get(function() {
  return this.workHistory.reduce((total, day) => total + day.totalEarned, 0);
});

// Index for better query performance
workerSchema.index({ owner: 1, name: 1 });
workerSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Worker', workerSchema);