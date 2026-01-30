require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const updateProductImages = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Tüm ürünlerin image alanını güncelle
    const result = await Product.updateMany(
      {},
      { $set: { image: '/images/october4-mama.jpg' } }
    );

    console.log(`✅ ${result.modifiedCount} ürünün görseli güncellendi`);

    // Güncellenmiş ürünleri listele
    const products = await Product.find({});
    console.log('\n📦 Güncellenmiş ürünler:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - Görsel: ${product.image}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

updateProductImages();
