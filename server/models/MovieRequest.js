const mongoose = require('mongoose');

const movieRequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  year: { type: Number },
  director: { type: String, trim: true, default: '' },
  language: { type: String, default: '' },
  description: { type: String, default: '' },
  requestedBy: { type: String, default: 'Anonymous' },
  status: { type: String, enum: ['pending', 'fulfilled', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MovieRequest', movieRequestSchema);
