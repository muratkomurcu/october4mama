const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  nextDueDate: { type: Date },
  reminderSentAt: { type: Date } // son hatırlatma gönderilme tarihi
}, { _id: true });

const treatmentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['pire', 'kene', 'iç parazit', 'diğer']
  },
  date: { type: Date, required: true },
  nextDueDate: { type: Date },
  reminderSentAt: { type: Date } // son hatırlatma gönderilme tarihi
}, { _id: true });

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
  },
  // Genişletilmiş alanlar
  birthDate: { type: Date },
  gender: {
    type: String,
    enum: ['erkek', 'dişi', 'bilinmiyor'],
    default: 'bilinmiyor'
  },
  isNeutered: { type: Boolean, default: false },
  photo: { type: String }, // Cloudinary URL
  healthNotes: { type: String, trim: true, maxlength: 500 },
  vaccinations: [vaccinationSchema],
  treatments: [treatmentSchema],
  birthdayReminderSentYear: { type: Number } // doğum günü emailinin gönderildiği yıl
}, {
  timestamps: true
});

module.exports = mongoose.model('Pet', petSchema);
