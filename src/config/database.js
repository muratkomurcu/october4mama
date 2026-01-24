const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB bağlantısı başarılı: ${conn.connection.host}`);

    // Admin kullanıcısını kontrol et ve yoksa oluştur
    await createAdminIfNotExists();
  } catch (error) {
    console.error(`❌ MongoDB bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

// Admin kullanıcısı yoksa oluştur
const createAdminIfNotExists = async () => {
  try {
    const User = require('../models/User');

    const existingAdmin = await User.findOne({ role: 'admin' });

    if (!existingAdmin) {
      const admin = new User({
        fullName: 'October 4 Admin',
        email: 'admin@october4.com',
        password: 'October4Admin2026!',
        phone: '05551234567',
        address: 'Admin',
        role: 'admin'
      });

      await admin.save();
      console.log('✅ Admin kullanıcısı oluşturuldu');
      console.log('📧 Email: admin@october4.com');
      console.log('🔑 Şifre: October4Admin2026!');
    } else {
      console.log('ℹ️  Admin kullanıcısı mevcut');
    }
  } catch (error) {
    console.error('Admin oluşturma hatası:', error.message);
  }
};

module.exports = connectDB;
