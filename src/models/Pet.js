const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  petType: {
    type: String,
    required: [true, 'Hayvan türü gereklidir'],
    enum: ['köpek', 'kedi']
  },
  petName: {
    type: String,
    required: [true, 'Hayvanın ismi gereklidir'],
    trim: true
  },
  petBreed: {
    type: String,
    required: [true, 'Hayvanın ırkı gereklidir'],
    trim: true
  },
  petWeight: {
    type: Number,
    required: [true, 'Hayvanın kilosu gereklidir'],
    min: [0.5, 'Kilo 0.5 kg\'dan az olamaz'],
    max: [100, 'Kilo 100 kg\'dan fazla olamaz']
  },
  petAge: {
    type: Number,
    required: [true, 'Hayvanın yaşı gereklidir'],
    min: [0, 'Yaş 0\'dan küçük olamaz'],
    max: [30, 'Yaş 30\'dan büyük olamaz']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pet', petSchema);
