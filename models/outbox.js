// models/outbox.js
const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  aggregateType: { type: String, required: true },
  aggregateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'processed', 'failed'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
});

// Index for efficient querying
outboxSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Outbox', outboxSchema);
