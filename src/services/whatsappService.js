const axios = require('axios');

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
    console.log('WhatsApp bildirimi devre disi veya ayarlar eksik');
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
    console.log('WhatsApp mesaji gonderildi');
    return true;
  } catch (error) {
    console.error('WhatsApp mesaji gonderilemedi:', error.message);
    return false;
  }
};

/**
 * Yeni sipariş bildirimi gönder (ödeme başarılı olduğunda)
 */
const sendOrderNotification = async (order) => {
  const customerName = order.user?.fullName || order.guestInfo?.fullName || 'Misafir';
  const customerPhone = order.user?.phone || order.guestInfo?.phone || '-';
  const totalPrice = order.totalAmount || order.totalPrice;

  // Ürün listesi - kısa ama tamamı
  const itemsList = (order.items || []).map(item => {
    const name = item.productName || item.product?.name || 'Urun';
    return `${name} x${item.quantity}`;
  }).join('\n');

  const orderDate = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const message = `*YENI SIPARIS #${order.orderNumber || order._id}*
Tarih: ${orderDate}
Ad Soyad: ${customerName}
Tel: ${customerPhone}
Adres: ${order.shippingAddress || '-'}

Urunler:
${itemsList}

*Toplam: ${totalPrice} TL - ODENDI*`;

  return await sendWhatsAppMessage(message);
};

/**
 * Sipariş durumu değişikliği bildirimi
 */
const sendStatusUpdateNotification = async (order, newStatus) => {
  const statusMessages = {
    'hazırlanıyor': 'Siparis hazirlaniyor',
    'kargoda': 'Siparis kargoya verildi',
    'teslim edildi': 'Siparis teslim edildi',
    'iptal': 'Siparis iptal edildi'
  };

  const customerName = order.user?.fullName || order.guestInfo?.fullName || 'Misafir';

  const message = `*OCTOBER 4 - SIPARIS GUNCELLEME*

Siparis No: #${order.orderNumber || order._id}
Musteri: ${customerName}
Durum: ${statusMessages[newStatus] || newStatus}
Guncelleme: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

/**
 * Günlük sabah selamlama mesajı (her gün 09:00 TR saati)
 */
const sendDailyGreeting = async () => {
  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const message = `*OCTOBER 4 - Gunaydin!*

${today}

Bugun gelen tum siparislerde size aninda bilgilendirme yapacagim. Hayirli isler!`;

  return await sendWhatsAppMessage(message);
};

/**
 * Anlık test mesajı
 */
const sendTestMessage = async () => {
  const message = `*OCTOBER 4 - Bildirim Sistemi Aktif*

WhatsApp bildirim sistemi basariyla calisiyor.
Yeni siparislerde otomatik bilgilendirme yapilacaktir.

Test zamani: ${new Date().toLocaleString('tr-TR')}`;

  return await sendWhatsAppMessage(message);
};

module.exports = {
  sendWhatsAppMessage,
  sendOrderNotification,
  sendStatusUpdateNotification,
  sendDailyGreeting,
  sendTestMessage
};
