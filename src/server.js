require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route dosyaları
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

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
  'https://sandbox-merchant.iyzipay.com',
  'https://merchant.iyzipay.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow iyzico payment domains
    if (origin && (origin.includes('iyzipay') || origin.includes('iyzico'))) {
      return callback(null, true);
    }
    // Don't block with error - just don't set CORS headers
    // Browser will enforce CORS for XHR, form POSTs will work
    return callback(null, false);
  },
  credentials: true
}));

// Rate limiting - genel
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100,
  message: { success: false, message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.' }
});

// Rate limiting - auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10,
  message: { success: false, message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
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

// WhatsApp servisi
const cron = require('node-cron');
const { sendDailyGreeting, sendTestMessage } = require('./services/whatsappService');
const { protect, admin } = require('./middleware/auth');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);

// Admin: WhatsApp test mesajı gönder
app.post('/api/whatsapp/test', protect, admin, async (req, res) => {
  const result = await sendTestMessage();
  res.json({
    success: result,
    message: result ? 'Test mesajı gönderildi!' : 'Mesaj gönderilemedi. WHATSAPP ayarlarını kontrol edin.'
  });
});

// Admin: Email test mesajı gönder
const { sendEmail, checkAbandonedCartsAndOrders: runAbandonedCheck } = require('./services/emailService');
app.post('/api/email/test', protect, admin, async (req, res) => {
  try {
    const result = await sendEmail({
      to: req.user.email,
      subject: 'October 4 - Email Test',
      html: '<h2>Email sistemi calisiyor!</h2><p>Bu bir test mesajidir.</p>',
    });
    res.json({
      success: result,
      message: result ? `Test emaili ${req.user.email} adresine gonderildi!` : 'Email gonderilemedi. SMTP ayarlarini kontrol edin.',
      config: {
        host: process.env.EMAIL_HOST || 'YOK',
        port: process.env.EMAIL_PORT || 'YOK',
        user: process.env.EMAIL_USER || 'YOK',
        from: process.env.EMAIL_FROM || 'YOK',
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// Admin: Abandoned cart kontrolunu manuel calistir
app.post('/api/email/check-abandoned', protect, admin, async (req, res) => {
  try {
    await runAbandonedCheck();
    res.json({ success: true, message: 'Abandoned cart/order kontrolu tamamlandi.' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Error handler (en sonda olmalı)
app.use(errorHandler);

// WhatsApp günlük selamlama cron job (her gün 09:00 Türkiye saati)
// Türkiye UTC+3, cron UTC'de çalışır: 09:00 TR = 06:00 UTC
cron.schedule('0 6 * * *', () => {
  console.log('Gunluk WhatsApp selamlama gonderiliyor...');
  sendDailyGreeting().catch(() => {});
});

// Terk edilen sepet ve tamamlanmamis siparis kontrolu (her saat basi)
cron.schedule('0 * * * *', () => {
  console.log('Abandoned cart/order kontrolu yapiliyor...');
  runAbandonedCheck().catch((err) => {
    console.error('Abandoned check hatasi:', err.message);
  });
});

// Server'ı başlat
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server ${process.env.NODE_ENV} modunda ${PORT} portunda çalışıyor`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`📍 Frontend URL: ${process.env.CLIENT_URL}\n`);

  // Sunucu başlangıcında anlık test mesajı gönder
  sendTestMessage().then(result => {
    if (result) console.log('✅ WhatsApp başlangıç mesajı gönderildi');
    else console.log('⚠️ WhatsApp mesajı gönderilemedi (ayarları kontrol edin)');
  }).catch(() => {});
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
