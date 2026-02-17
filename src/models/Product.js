const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Kategori gereklidir'],
    enum: ['kedi', 'köpek']
  },
  ageGroup: {
    type: String,
    required: [true, 'Yaş grubu gereklidir'],
    enum: ['yetişkin', 'yavru']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat gereklidir'],
    min: [0, 'Fiyat 0\'dan küçük olamaz']
  },
  weight: {
    type: String,
    required: [true, 'Ağırlık bilgisi gereklidir']
  },
  image: {
    type: String,
    required: [true, 'Ürün görseli gereklidir']
  },
  images: [{
    type: String
  }],
  description: {
    type: String,
    required: [true, 'Ürün açıklaması gereklidir']
  },
  nutritionalInfo: {
    protein: String,
    fat: String,
    cellulose: String,
    ash: String
  },
  features: [{
    type: String
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 100,
    min: [0, 'Stok miktarı 0\'dan küçük olamaz']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
