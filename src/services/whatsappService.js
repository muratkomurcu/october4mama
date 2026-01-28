const axios = require('axios');

/**
 * WhatsApp Bildirim Servisi (CallMeBot API)
 *
 * KURULUM:
 * 1. WhatsApp'ta +34 644 71 81 99 numarasına mesaj gönderin
 * 2. Mesaj: "I allow callmebot to send me messages"
 * 3. Size bir API key gelecek, onu aşağıya yazın
 *
 * Veya: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

const WHATSAPP_CONFIG = {
  // İşletme sahibinin telefon numarası (başında ülke kodu ile, + işareti olmadan)
  phoneNumber: process.env.WHATSAPP_PHONE || '905055020505',
  // CallMeBot API key (kurulum sonrası alacaksınız)
  apiKey: process.env.WHATSAPP_API_KEY || '',
  // Bildirim aktif mi?
  enabled: process.env.WHATSAPP_ENABLED === 'true'
};

/**
 * WhatsApp mesajı gönder
 * @param {string} message - Gönderilecek mesaj
 */
const sendWhatsAppMessage = async (message) => {
  if (!WHATSAPP_CONFIG.enabled || !WHATSAPP_CONFIG.apiKey) {
    console.log('📱 WhatsApp bildirimi devre dışı veya API key eksik');
    return false;
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php`;
    const params = {
      phone: WHATSAPP_CONFIG.phoneNumber,
      text: message,
      apikey: WHATSAPP_CONFIG.apiKey
    };

    const response = await axios.get(url, { params });
    console.log('✅ WhatsApp mesajı gönderildi');
    return true;
  } catch (error) {
    console.error('❌ WhatsApp mesajı gönderilemedi:', error.message);
    return false;
  }
};

/**
 * Yeni sipariş bildirimi gönder
 * @param {Object} order - Sipariş objesi
 */
const sendOrderNotification = async (order) => {
  const message = `🛒 *YENİ SİPARİŞ*

📦 Sipariş No: #${order._id.toString().slice(-6).toUpperCase()}
👤 Müşteri: ${order.user?.fullName || 'Bilinmiyor'}
📱 Telefon: ${order.shippingAddress?.phone || 'Belirtilmemiş'}
📍 Adres: ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}

💰 Toplam: ${order.totalAmount} TL
📝 Ürün Sayısı: ${order.items?.length || 0}

⏰ Tarih: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

/**
 * Sipariş durumu değişikliği bildirimi
 * @param {Object} order - Sipariş objesi
 * @param {string} newStatus - Yeni durum
 */
const sendStatusUpdateNotification = async (order, newStatus) => {
  const statusMessages = {
    'confirmed': '✅ Sipariş onaylandı',
    'preparing': '📦 Sipariş hazırlanıyor',
    'shipped': '🚚 Sipariş kargoya verildi',
    'delivered': '✅ Sipariş teslim edildi',
    'cancelled': '❌ Sipariş iptal edildi'
  };

  const message = `📋 *SİPARİŞ DURUMU DEĞİŞTİ*

📦 Sipariş No: #${order._id.toString().slice(-6).toUpperCase()}
${statusMessages[newStatus] || `Yeni Durum: ${newStatus}`}

⏰ Güncelleme: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

module.exports = {
  sendWhatsAppMessage,
  sendOrderNotification,
  sendStatusUpdateNotification
};
