const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Reklam', 'Fatura', 'Kira', 'İşçilik', 'Malzeme', 'Diğer'],
    required: [true, 'Kategori gerekli']
  },
  description: {
    type: String,
    required: [true, 'Açıklama gerekli'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Tutar gerekli'],
    min: 0
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

module.exports = mongoose.model('Expense', expenseSchema);
