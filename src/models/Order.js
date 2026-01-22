const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [orderItemSchema],
  totalPrice: {
    type: Number,
    required: true
  },
  shippingAddress: {
    type: String,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['beklemede', 'ödendi', 'iptal'],
    default: 'beklemede'
  },
  orderStatus: {
    type: String,
    enum: ['hazırlanıyor', 'kargoda', 'teslim edildi', 'iptal'],
    default: 'hazırlanıyor'
  },
  paymentMethod: {
    type: String,
    enum: ['kredi_kartı', 'banka_kartı'],
    default: 'kredi_kartı'
  },
  paymentDetails: {
    conversationId: String,
    paymentId: String,
    transactionId: String
  },
  trackingNumber: String,
  notes: String
}, {
  timestamps: true
});

// Sipariş numarası oluştur
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    this.orderNumber = `OCT4-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
