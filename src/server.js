require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route dosyaları
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Express uygulaması
const app = express();

// Veritabanı bağlantısı
connectDB();

// Middleware'ler
const allowedOrigins = [
  'http://localhost:5173',
  'https://october4mama.tr',
  'https://www.october4mama.tr',
  'http://october4mama.tr',
  'http://www.october4mama.tr',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Production'da tüm originlere izin ver
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ana route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'October 4 Pet Food API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Error handler (en sonda olmalı)
app.use(errorHandler);

// Server'ı başlat
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server ${process.env.NODE_ENV} modunda ${PORT} portunda çalışıyor`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📍 Frontend URL: ${process.env.CLIENT_URL}\n`);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
