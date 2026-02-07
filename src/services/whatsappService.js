const axios = require('axios');

/**
 * WhatsApp Bildirim Servisi (CallMeBot API)
 *
 * KURULUM:
 * 1. WhatsApp'ta +34 644 71 81 99 numarasına mesaj gönderin
 * 2. Mesaj: "I allow callmebot to send me messages"
 * 3. Size bir API key gelecek, onu .env dosyasına WHATSAPP_API_KEY olarak yazın
 * 4. .env'ye WHATSAPP_ENABLED=true ekleyin
 *
 * Veya: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

const WHATSAPP_CONFIG = {
  phoneNumber: process.env.WHATSAPP_PHONE || '',
  apiKey: process.env.WHATSAPP_API_KEY || '',
  enabled: process.env.WHATSAPP_ENABLED === 'true'
};

/**
 * WhatsApp mesajı gönder
 */
const sendWhatsAppMessage = async (message) => {
  if (!WHATSAPP_CONFIG.enabled || !WHATSAPP_CONFIG.apiKey || !WHATSAPP_CONFIG.phoneNumber) {
    console.log('📱 WhatsApp bildirimi devre dışı veya ayarlar eksik');
    return false;
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php`;
    const params = {
      phone: WHATSAPP_CONFIG.phoneNumber,
      text: message,
      apikey: WHATSAPP_CONFIG.apiKey
    };

    await axios.get(url, { params, timeout: 10000 });
    console.log('✅ WhatsApp mesajı gönderildi');
    return true;
  } catch (error) {
    console.error('❌ WhatsApp mesajı gönderilemedi:', error.message);
    return false;
  }
};

/**
 * Yeni sipariş bildirimi gönder (ödeme başarılı olduğunda)
 */
const sendOrderNotification = async (order) => {
  // Müşteri bilgilerini al
  const customerName = order.user?.fullName || order.guestInfo?.fullName || 'Misafir';
  const customerPhone = order.user?.phone || order.guestInfo?.phone || '';
  const customerEmail = order.user?.email || order.guestInfo?.email || '';

  // Ürün listesi
  const itemsList = order.items?.map(item =>
    `  - ${item.productName || 'Ürün'} x${item.quantity} = ${(item.price * item.quantity).toFixed(2)} TL`
  ).join('\n') || '';

  const message = `🛒 *YENİ SİPARİŞ ÖDEME ALINDI!*

📦 Sipariş No: ${order.orderNumber || order._id}
👤 Müşteri: ${customerName}
📧 E-posta: ${customerEmail}
📱 Telefon: ${customerPhone}
📍 Adres: ${order.shippingAddress || 'Belirtilmemiş'}

📝 Ürünler:
${itemsList}

💰 Toplam: ${order.totalAmount || order.totalPrice} TL
⏰ Tarih: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

/**
 * Sipariş durumu değişikliği bildirimi
 */
const sendStatusUpdateNotification = async (order, newStatus) => {
  const statusMessages = {
    'hazırlanıyor': '📦 Sipariş hazırlanıyor',
    'kargoda': '🚚 Sipariş kargoya verildi',
    'teslim edildi': '✅ Sipariş teslim edildi',
    'iptal': '❌ Sipariş iptal edildi'
  };

  const message = `📋 *SİPARİŞ DURUMU DEĞİŞTİ*

📦 Sipariş No: ${order.orderNumber || order._id}
${statusMessages[newStatus] || `Yeni Durum: ${newStatus}`}

⏰ Güncelleme: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

module.exports = {
  sendWhatsAppMessage,
  sendOrderNotification,
  sendStatusUpdateNotification
};
