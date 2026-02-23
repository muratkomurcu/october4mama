const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Ürün gereklidir']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Kullanıcı gereklidir']
  },
  rating: {
    type: Number,
    required: [true, 'Puan gereklidir'],
    min: [1, 'Puan en az 1 olmalıdır'],
    max: [5, 'Puan en fazla 5 olmalıdır']
  },
  comment: {
    type: String,
    required: [true, 'Yorum gereklidir'],
    trim: true,
    minlength: [10, 'Yorum en az 10 karakter olmalıdır'],
    maxlength: [500, 'Yorum en fazla 500 karakter olabilir']
  }
}, {
  timestamps: true
});

// Bir kullanıcı aynı ürüne sadece bir yorum yapabilir
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
