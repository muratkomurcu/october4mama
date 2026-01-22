# October 4 Pet Food Backend API

October 4 e-ticaret sitesi için Node.js + Express + MongoDB backend API'si.

## 🚀 Özellikler

- ✅ Kullanıcı kaydı ve girişi (JWT Authentication)
- ✅ Evcil hayvan bilgileri yönetimi
- ✅ Ürün listeleme ve yönetimi (CRUD)
- ✅ Sepet yönetimi
- ✅ Sipariş oluşturma ve takibi
- ✅ Admin paneli desteği
- ✅ Güvenli şifreleme (bcrypt)
- ✅ Input validation
- ✅ Error handling
- ✅ CORS desteği

## 📋 Gereksinimler

- Node.js v14 veya üzeri
- MongoDB v4.4 veya üzeri (yerel veya MongoDB Atlas)
- npm veya yarn

## 📦 Kurulum

### 1. Bağımlılıkları yükleyin

\`\`\`bash
cd october4-backend
npm install
\`\`\`

### 2. Environment variables ayarlayın

\`.env.example\` dosyasını \`.env\` olarak kopyalayın:

\`\`\`bash
cp .env.example .env
\`\`\`

\`.env\` dosyasını düzenleyin:

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/october4_db
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
\`\`\`

### 3. MongoDB'yi başlatın

**Yerel MongoDB:**
\`\`\`bash
mongod
\`\`\`

**Veya MongoDB Atlas kullanın:**
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
- Cluster oluşturun
- Connection string'i alın ve \`.env\` dosyasına ekleyin

### 4. Sunucuyu başlatın

**Development modu:**
\`\`\`bash
npm run dev
\`\`\`

**Production modu:**
\`\`\`bash
npm start
\`\`\`

Server **http://localhost:5000** adresinde çalışacak.

## 📁 Proje Yapısı

\`\`\`
october4-backend/
├── src/
│   ├── config/
│   │   └── database.js        # MongoDB bağlantısı
│   ├── controllers/           # Controller dosyaları
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── middleware/            # Middleware dosyaları
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Error handling
│   │   └── validate.js       # Input validation
│   ├── models/               # Mongoose modelleri
│   │   ├── User.js
│   │   ├── Pet.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/               # Route dosyaları
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   └── server.js             # Ana server dosyası
├── .env                       # Environment variables
├── .env.example              # Environment variables örneği
├── .gitignore
├── package.json
└── README.md
\`\`\`

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Açıklama | Auth Gerekli |
|--------|----------|----------|--------------|
| POST | /api/auth/register | Kullanıcı kaydı | ❌ |
| POST | /api/auth/login | Kullanıcı girişi | ❌ |
| GET | /api/auth/me | Profil bilgisi | ✅ |
| PUT | /api/auth/me | Profil güncelle | ✅ |

### Products

| Method | Endpoint | Açıklama | Auth Gerekli |
|--------|----------|----------|--------------|
| GET | /api/products | Tüm ürünleri listele | ❌ |
| GET | /api/products/:id | Tek ürün detayı | ❌ |
| POST | /api/products | Yeni ürün ekle | ✅ Admin |
| PUT | /api/products/:id | Ürün güncelle | ✅ Admin |
| DELETE | /api/products/:id | Ürün sil | ✅ Admin |

### Cart

| Method | Endpoint | Açıklama | Auth Gerekli |
|--------|----------|----------|--------------|
| GET | /api/cart | Sepeti getir | ✅ |
| POST | /api/cart/items | Sepete ürün ekle | ✅ |
| PUT | /api/cart/items/:productId | Ürün miktarını güncelle | ✅ |
| DELETE | /api/cart/items/:productId | Sepetten ürün çıkar | ✅ |
| DELETE | /api/cart | Sepeti temizle | ✅ |

### Orders

| Method | Endpoint | Açıklama | Auth Gerekli |
|--------|----------|----------|--------------|
| POST | /api/orders | Sipariş oluştur | ✅ |
| GET | /api/orders | Siparişlerimi getir | ✅ |
| GET | /api/orders/:id | Sipariş detayı | ✅ |
| GET | /api/orders/admin/all | Tüm siparişler | ✅ Admin |
| PUT | /api/orders/:id/status | Sipariş durumunu güncelle | ✅ Admin |

## 🔐 Authentication

API, JWT (JSON Web Token) kullanarak authentication yapar.

### Kullanım:

1. `/api/auth/login` veya `/api/auth/register` endpoint'inden token alın
2. Her istekte Authorization header'ına token ekleyin:

\`\`\`
Authorization: Bearer <token>
\`\`\`

## 📝 Örnek İstekler

### Kullanıcı Kaydı

\`\`\`bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "fullName": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "phone": "05551234567",
  "password": "123456",
  "address": "İstanbul, Türkiye",
  "petType": "köpek",
  "petName": "Max",
  "petBreed": "Golden Retriever",
  "petWeight": 25.5,
  "petAge": 3
}
\`\`\`

### Kullanıcı Girişi

\`\`\`bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "ahmet@example.com",
  "password": "123456"
}
\`\`\`

### Ürünleri Listele

\`\`\`bash
GET http://localhost:5000/api/products
\`\`\`

Filtre ile:
\`\`\`bash
GET http://localhost:5000/api/products?category=köpek&ageGroup=yavru
\`\`\`

### Sepete Ürün Ekle

\`\`\`bash
POST http://localhost:5000/api/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "quantity": 2
}
\`\`\`

### Sipariş Oluştur

\`\`\`bash
POST http://localhost:5000/api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": "İstanbul, Kadıköy",
  "paymentMethod": "kredi_kartı"
}
\`\`\`

## 🗄️ Veritabanı Modelleri

### User (Kullanıcı)
- fullName, email, phone, password, address
- pets (Pet array)
- role (user/admin)
- isActive

### Pet (Evcil Hayvan)
- user (User ref)
- petType, petName, petBreed
- petWeight, petAge

### Product (Ürün)
- name, category, ageGroup
- price, weight, image
- description, features
- inStock, stockQuantity

### Cart (Sepet)
- user (User ref)
- items (Product array with quantity)
- totalPrice

### Order (Sipariş)
- user (User ref)
- orderNumber (otomatik oluşturulur)
- items (Product array)
- totalPrice, shippingCost
- shippingAddress
- paymentStatus, orderStatus
- paymentMethod, paymentDetails
- trackingNumber

## 🔧 Geliştirme

### Test Kullanıcısı Oluşturma

MongoDB shell veya Compass kullanarak bir admin kullanıcısı oluşturabilirsiniz:

\`\`\`javascript
use october4_db

db.users.insertOne({
  fullName: "Admin",
  email: "admin@october4.com",
  phone: "05551234567",
  password: "$2a$10$...", // bcrypt hash
  address: "İstanbul",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
\`\`\`

### Ürün Ekleme

Postman veya benzeri tool ile:

\`\`\`bash
POST http://localhost:5000/api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "October 4 Yetişkin Kedi Maması",
  "category": "kedi",
  "ageGroup": "yetişkin",
  "price": 299.99,
  "weight": "2kg",
  "image": "/images/adult-cat-food.jpg",
  "description": "Yetişkin kediler için özel formül...",
  "features": [
    "Yüksek proteinli formül",
    "Omega-3 ve Omega-6 içerir"
  ],
  "inStock": true,
  "stockQuantity": 100
}
\`\`\`

## 🐛 Hata Ayıklama

Server loglarını kontrol edin:
\`\`\`bash
npm run dev
\`\`\`

MongoDB bağlantısı sorunları için:
- MongoDB servisinin çalıştığından emin olun
- `.env` dosyasındaki MONGODB_URI'yi kontrol edin
- Network erişimini kontrol edin (Atlas kullanıyorsanız)

## 📞 Yardım

Sorunlarınız için:
1. Server loglarını kontrol edin
2. MongoDB bağlantısını test edin
3. `.env` dosyasını kontrol edin
4. Port çakışması olmadığından emin olun

## 🔜 Sıradaki Adımlar

- [ ] iyzico ödeme entegrasyonu
- [ ] E-posta bildirimleri (Nodemailer)
- [ ] Dosya upload (ürün görselleri)
- [ ] Rate limiting
- [ ] API documentation (Swagger)
- [ ] Unit ve integration testleri
- [ ] Logging sistemi (Winston)

---

© 2026 October 4. Tüm hakları saklıdır.
