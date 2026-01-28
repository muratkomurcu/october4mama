const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB bağlantısı başarılı: ${conn.connection.host}`);

    // Admin kullanıcısını kontrol et ve yoksa oluştur
    await createAdminIfNotExists();
    // Ürünleri kontrol et ve yoksa oluştur
    await seedProductsIfEmpty();
  } catch (error) {
    console.error(`❌ MongoDB bağlantı hatası: ${error.message}`);
    process.exit(1);
  }
};

// Admin kullanıcısını kontrol et ve yoksa oluştur
const createAdminIfNotExists = async () => {
  try {
    const User = require('../models/User');

    const existingAdmin = await User.findOne({ email: 'admin@october4.com' });

    if (!existingAdmin) {
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
    } else {
      console.log('ℹ️  Admin kullanıcısı mevcut');
    }
  } catch (error) {
    console.error('Admin oluşturma hatası:', error.message);
  }
};

// Ürünleri kontrol et ve yoksa varsayılan ürünleri ekle
const seedProductsIfEmpty = async () => {
  try {
    const Product = require('../models/Product');

    const productCount = await Product.countDocuments();

    if (productCount === 0) {
      const defaultProducts = [
        {
          name: "October 4 Yetişkin Kedi Maması",
          category: "kedi",
          ageGroup: "yetişkin",
          price: 299.99,
          weight: "15 KG",
          image: "/logo.jpeg",
          description: "Yetişkin kediler için özel formül. Yüksek protein, omega-3 ve omega-6 içeriği ile tüy sağlığını destekler.",
          features: ["Yüksek proteinli formül", "Omega-3 ve Omega-6 içerir"],
          inStock: true,
          stockQuantity: 100
        },
        {
          name: "October 4 Yavru Kedi Maması",
          category: "kedi",
          ageGroup: "yavru",
          price: 319.99,
          weight: "15 KG",
          image: "/logo.jpeg",
          description: "Yavru kediler için geliştirilmiş özel formül. Sağlıklı büyüme ve gelişim için tüm besin değerlerini içerir.",
          features: ["Büyüme için özel formül", "DHA içerir (beyin gelişimi)"],
          inStock: true,
          stockQuantity: 100
        },
        {
          name: "October 4 Yetişkin Köpek Maması",
          category: "köpek",
          ageGroup: "yetişkin",
          price: 349.99,
          weight: "15 KG",
          image: "/logo.jpeg",
          description: "Yetişkin köpekler için dengeli beslenme. Aktif yaşam için gerekli tüm besin değerleri.",
          features: ["Dengeli protein ve enerji", "Eklem sağlığı desteği"],
          inStock: true,
          stockQuantity: 100
        },
        {
          name: "October 4 Yavru Köpek Maması",
          category: "köpek",
          ageGroup: "yavru",
          price: 369.99,
          weight: "15 KG",
          image: "/logo.jpeg",
          description: "Yavru köpekler için özel geliştirilmiş formül. Sağlıklı büyüme ve kemik gelişimi için ideal.",
          features: ["Büyüme için özel formül", "Kalsiyum ve fosfor dengesi"],
          inStock: true,
          stockQuantity: 100
        }
      ];

      await Product.insertMany(defaultProducts);
      console.log('✅ 4 varsayılan ürün eklendi');
    } else {
      console.log(`ℹ️  ${productCount} ürün mevcut`);
    }
  } catch (error) {
    console.error('Ürün seed hatası:', error.message);
  }
};

module.exports = connectDB;
