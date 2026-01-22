const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Admin kullanıcısı var mı kontrol et
    const existingAdmin = await User.findOne({ email: 'admin@october4.com' });

    if (existingAdmin) {
      console.log('⚠️  Admin kullanıcısı zaten mevcut');
      console.log('Email: admin@october4.com');
      process.exit(0);
    }

    // Admin kullanıcısı oluştur
    const admin = new User({
      fullName: 'October 4 Admin',
      email: 'admin@october4.com',
      password: 'admin123456', // ÖNEMLİ: Gerçek kullanımda güçlü şifre kullanın!
      phone: '05551234567',
      address: 'Admin Adresi',
      role: 'admin'
    });

    await admin.save();

    console.log('✅ Admin kullanıcısı oluşturuldu!');
    console.log('');
    console.log('📧 Email: admin@october4.com');
    console.log('🔑 Şifre: admin123456');
    console.log('');
    console.log('⚠️  UYARI: Gerçek kullanımda bu şifreyi mutlaka değiştirin!');
    console.log('');
    console.log('Admin paneline giriş için: http://localhost:5173/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

createAdminUser();
