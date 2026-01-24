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

// Admin kullanıcısını sil ve yeniden oluştur
const createAdminIfNotExists = async () => {
  try {
    const User = require('../models/User');

    // Mevcut admini sil
    await User.deleteOne({ email: 'admin@october4.com' });

    // Yeni admin oluştur
    const admin = new User({
      fullName: 'October 4 Admin',
      email: 'admin@october4.com',
      password: 'admin123',
      phone: '05551234567',
      address: 'Admin',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin kullanıcısı oluşturuldu');
    console.log('📧 Email: admin@october4.com');
    console.log('🔑 Şifre: admin123');
  } catch (error) {
    console.error('Admin oluşturma hatası:', error.message);
  }
};

module.exports = connectDB;
