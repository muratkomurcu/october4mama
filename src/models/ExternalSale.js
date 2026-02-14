const mongoose = require('mongoose');

const externalSaleSchema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, 'Ürün adı gerekli']
  },
  platform: {
    type: String,
    enum: ['Trendyol', 'Hepsiburada', 'Mağaza', 'Diğer'],
    required: [true, 'Platform gerekli']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Alış fiyatı gerekli'],
    min: 0
  },
  salePrice: {
    type: Number,
    required: [true, 'Satış fiyatı gerekli'],
    min: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Adet gerekli'],
    min: 1,
    default: 1
  },
  profit: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Kar otomatik hesaplansin
externalSaleSchema.pre('validate', function() {
  this.profit = (this.salePrice - this.purchasePrice) * this.quantity;
});

module.exports = mongoose.model('ExternalSale', externalSaleSchema);
