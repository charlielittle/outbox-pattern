// models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  outboxEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outbox' },
  type: { 
    type: String, 
    enum: ['email', 'push', 'sms', 'in-app'], 
    required: true 
  },
  content: {
    subject: String,
    body: String,
    data: mongoose.Schema.Types.Mixed
  },
  status: { 
    type: String, 
    enum: ['queued', 'sent', 'delivered', 'failed'], 
    default: 'queued' 
  },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date },
  deliveredAt: { type: Date }
});

module.exports = mongoose.model('Notification', notificationSchema);
