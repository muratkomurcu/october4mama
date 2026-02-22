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
const externalSaleRoutes = require('./routes/externalSaleRoutes');
const couponRoutes = require('./routes/couponRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

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
app.use('/api/external-sales', externalSaleRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/expenses', expenseRoutes);

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
    const toEmail = req.body.to || req.user.email;
    const result = await sendEmail({
      to: toEmail,
      subject: 'October 4 - Email Test',
      html: '<h2>Email sistemi calisiyor!</h2><p>Bu bir test mesajidir.</p>',
    });
    res.json({
      success: result,
      message: result ? `Test emaili ${toEmail} adresine gonderildi!` : 'Email gonderilemedi. SMTP ayarlarini kontrol edin.',
      config: {
        host: process.env.EMAIL_HOST || 'YOK',
        port: process.env.EMAIL_PORT || 'YOK',
        user: process.env.EMAIL_USER || 'YOK',
        from: process.env.EMAIL_FROM || 'YOK',
      }
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
      code: error.code || null,
      responseCode: error.responseCode || null,
      config: {
        host: process.env.EMAIL_HOST || 'YOK',
        port: process.env.EMAIL_PORT || 'YOK',
        user: process.env.EMAIL_USER || 'YOK',
        secure: process.env.EMAIL_SECURE || 'YOK',
      }
    });
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

// ── Meta Commerce Manager ürün feed'i (XML) ──────────────────────────────────
// URL: https://october4mama.onrender.com/api/meta-feed
const Product = require('./models/Product');

app.get('/api/meta-feed', async (req, res) => {
  try {
    const products = await Product.find({ inStock: true });

    const esc = (s = '') => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const items = products.map(p => {
      const isKedi = p.category === 'kedi';
      const offerId = `OCT4-${isKedi ? 'CAT' : 'DOG'}-${p._id.toString().slice(-6).toUpperCase()}`;
      const googleCat = isKedi
        ? 'Evcil Hayvan Malzemeleri > Kedi Malzemeleri > Kedi Maması > Kuru Mama'
        : 'Evcil Hayvan Malzemeleri > Köpek Malzemeleri > Köpek Maması > Kuru Mama';
      const cleanDesc = esc(p.description.replace(/✔/g, '').replace(/\s+/g, ' ').trim());
      const title = esc(`${p.name} – Tahılsız, ${p.weight}`).slice(0, 150);

      return `    <item>
      <g:id>${offerId}</g:id>
      <g:title>${title}</g:title>
      <g:description>${cleanDesc}</g:description>
      <g:link>https://october4mama.tr/product/${p._id}</g:link>
      <g:image_link>${esc(p.image)}</g:image_link>
      <g:availability>${p.inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${p.price} TRY</g:price>
      <g:brand>October4</g:brand>
      <g:google_product_category>${esc(googleCat)}</g:google_product_category>
      <g:product_type>${isKedi ? 'Kedi Maması' : 'Köpek Maması'} &gt; Tahılsız</g:product_type>
      <g:shipping>
        <g:country>TR</g:country>
        <g:service>Ücretsiz Kargo</g:service>
        <g:price>0 TRY</g:price>
      </g:shipping>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>October4 Pet Food Ürün Kataloğu</title>
    <link>https://october4mama.tr</link>
    <description>October4 Kedi ve Köpek Maması – Tahılsız Premium Mama</description>
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

// Terk edilen sepet ve tamamlanmamis siparis kontrolu (her 30 dakikada bir)
cron.schedule('*/30 * * * *', () => {
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
