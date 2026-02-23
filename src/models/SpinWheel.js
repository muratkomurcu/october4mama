const mongoose = require('mongoose');

const spinWheelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  lastSpinDate: {
    type: Date,
    required: true
  },
  couponCode: {
    type: String,
    default: null
  },
  prize: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SpinWheel', spinWheelSchema);
