const mongoose = require('mongoose');

// Single-document counter — we upsert one doc with _id: 'global'
const siteVisitSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  count: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
