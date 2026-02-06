const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB baglantisi basarili');

    const newPassword = process.env.ADMIN_PASSWORD || 'Oct4Admin2026!';

    const admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@october4.com' });

    if (!admin) {
      console.log('Admin kullanicisi bulunamadi');
      process.exit(1);
    }

    admin.password = newPassword;
    await admin.save();

    console.log('Admin sifresi guncellendi!');
    console.log('Email:', admin.email);
    console.log('Yeni sifre:', newPassword);

    process.exit(0);
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
};

updateAdminPassword();
