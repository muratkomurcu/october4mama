require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  {
    name: "October 4 Yetişkin Kedi Maması",
    category: "kedi",
    ageGroup: "yetişkin",
    price: 299.99,
    weight: "2kg",
    image: "/images/adult-cat-food.jpg",
    description: "Yetişkin kediler için özel formül. Yüksek protein, omega-3 ve omega-6 içeriği ile tüy sağlığını destekler.",
    features: [
      "Yüksek proteinli formül",
      "Omega-3 ve Omega-6 içerir",
      "Doğal antioksidanlar",
      "Sindirim sağlığını destekler"
    ],
    inStock: true,
    stockQuantity: 100
  },
  {
    name: "October 4 Yavru Kedi Maması",
    category: "kedi",
    ageGroup: "yavru",
    price: 319.99,
    weight: "2kg",
    image: "/images/kitten-food.jpg",
    description: "Yavru kediler için geliştirilmiş özel formül. Sağlıklı büyüme ve gelişim için tüm besin değerlerini içerir.",
    features: [
      "Büyüme için özel formül",
      "DHA içerir (beyin gelişimi)",
      "Kolay sindirilir",
      "Bağışıklık sistemi desteği"
    ],
    inStock: true,
    stockQuantity: 100
  },
  {
    name: "October 4 Yetişkin Köpek Maması",
    category: "köpek",
    ageGroup: "yetişkin",
    price: 349.99,
    weight: "3kg",
    image: "/images/adult-dog-food.jpg",
    description: "Yetişkin köpekler için dengeli beslenme. Aktif yaşam için gerekli tüm besin değerleri.",
    features: [
      "Dengeli protein ve enerji",
      "Eklem sağlığı desteği",
      "Sağlıklı tüy ve cilt",
      "Prebiyotik içerir"
    ],
    inStock: true,
    stockQuantity: 100
  },
  {
    name: "October 4 Yavru Köpek Maması",
    category: "köpek",
    ageGroup: "yavru",
    price: 369.99,
    weight: "3kg",
    image: "/images/puppy-food.jpg",
    description: "Yavru köpekler için özel geliştirilmiş formül. Sağlıklı büyüme ve kemik gelişimi için ideal.",
    features: [
      "Büyüme için özel formül",
      "Kalsiyum ve fosfor dengesi",
      "Kolay çiğnenebilir taneler",
      "Bağışıklık sistemi güçlendirir"
    ],
    inStock: true,
    stockQuantity: 100
  }
];

const seedProducts = async () => {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Mevcut ürünleri sil
    await Product.deleteMany({});
    console.log('🗑️  Mevcut ürünler silindi');

    // Yeni ürünleri ekle
    await Product.insertMany(products);
    console.log('✅ 4 ürün başarıyla eklendi');

    console.log('\n📦 Eklenen ürünler:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.price} TL`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

seedProducts();
