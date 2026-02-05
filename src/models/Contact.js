const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad soyad gereklidir'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta gereklidir'],
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: [true, 'Konu gereklidir'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Mesaj gereklidir'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
