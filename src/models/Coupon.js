const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Kupon kodu gerekli'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: [true, 'İndirim tipi gerekli']
  },
  discountValue: {
    type: Number,
    required: [true, 'İndirim değeri gerekli'],
    min: 0
  },
  maxUses: {
    type: Number,
    default: 50,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  appliesTo: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);
