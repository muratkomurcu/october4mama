const nodemailer = require('nodemailer');

// Lazy-init transporter
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 465,
      secure: process.env.EMAIL_SECURE !== 'false',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
}

/**
 * Genel email gönderme fonksiyonu
 */
async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('Email transporter yapilandirilmamis');
    return false;
  }
  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || '"October 4 Pet Food" <info@october4mama.tr>',
      to,
      subject,
      html,
    });
    console.log(`Email gonderildi: ${to} - ${subject}`);
    return true;
  } catch (error) {
    console.error('Email gonderilemedi:', error.message, error.code, error.responseCode);
    throw error;
  }
}

// ===================== HTML TEMPLATE'LER =====================

const LOGO_URL = 'https://october4mama.tr/logo.jpeg';

function emailHeader() {
  return `
        <!-- Header -->
        <tr>
          <td style="background-color:#4a7c59;padding:25px 30px;text-align:center;">
            <img src="${LOGO_URL}" alt="October 4" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:10px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">OCTOBER 4</h1>
            <p style="margin:4px 0 0;color:#d4e8d0;font-size:12px;">Patili Dostlarınız İçin Doğal Mamalar</p>
          </td>
        </tr>`;
}

function emailFooter() {
  return `
        <!-- Footer -->
        <tr>
          <td style="background-color:#f8f6f0;padding:25px 30px;text-align:center;">
            <p style="margin:0 0 5px;font-size:13px;color:#888;">Sorularınız için bize ulaşın</p>
            <p style="margin:0;font-size:13px;color:#4a7c59;">info@october4mama.tr | 0505 502 05 05</p>
            <p style="margin:10px 0 0;font-size:12px;color:#aaa;">october4mama.tr</p>
          </td>
        </tr>`;
}

function productRow(name, image, qty, subtotal) {
  return `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">
          ${image ? `<img src="${image}" alt="${name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : ''}
        </td>
        <td style="padding:12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
          ${name}<br>
          <span style="color:#888;font-size:12px;">x${qty}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:bold;color:#333;">
          ${subtotal.toFixed(2)} TL
        </td>
      </tr>`;
}

function orderConfirmationTemplate(order, customerName) {
  const orderDate = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

  const itemRows = (order.items || []).map(item => {
    const name = item.productName || item.product?.name || 'Ürün';
    const image = item.product?.image || item.product?.images?.[0] || '';
    const price = item.price || 0;
    const qty = item.quantity || 1;
    const subtotal = item.subtotal || (price * qty);
    return productRow(name, image, qty, subtotal);
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">

        ${emailHeader()}

        <!-- Onay Mesajı -->
        <tr>
          <td style="padding:30px 30px 20px;">
            <h2 style="margin:0 0 10px;color:#4a7c59;font-size:20px;">Siparişinizi Aldık!</h2>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
              Merhaba <strong>${customerName}</strong>,<br><br>
              Siparişiniz başarıyla alındı, çok teşekkür ederiz! Patili dostunuzun mamalarını özenle hazırlayıp en kısa sürede kargoya teslim edeceğiz. Siparişinizle ilgili herhangi bir sorunuz olursa bize ulaşmaktan çekinmeyin.
            </p>
          </td>
        </tr>

        <!-- Sipariş Bilgileri -->
        <tr>
          <td style="padding:0 30px;">
            <table width="100%" style="background-color:#f8f6f0;border-radius:8px;padding:15px;">
              <tr>
                <td style="padding:8px 15px;font-size:13px;color:#888;">Sipariş No:</td>
                <td style="padding:8px 15px;font-size:13px;color:#333;font-weight:bold;text-align:right;">#${order.orderNumber || order._id}</td>
              </tr>
              <tr>
                <td style="padding:8px 15px;font-size:13px;color:#888;">Tarih:</td>
                <td style="padding:8px 15px;font-size:13px;color:#333;text-align:right;">${orderDate}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ürünler -->
        <tr>
          <td style="padding:20px 30px 10px;">
            <h3 style="margin:0 0 10px;color:#333;font-size:16px;">Sipariş Detayları</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
          </td>
        </tr>

        <!-- Toplam -->
        <tr>
          <td style="padding:10px 30px 20px;">
            <table width="100%" style="background-color:#4a7c59;border-radius:8px;">
              <tr>
                <td style="padding:15px 20px;color:#fff;font-size:14px;">Kargo:</td>
                <td style="padding:15px 20px;color:#fff;font-size:14px;text-align:right;">Ücretsiz</td>
              </tr>
              <tr>
                <td style="padding:0 20px 15px;color:#fff;font-size:18px;font-weight:bold;">Toplam:</td>
                <td style="padding:0 20px 15px;color:#fff;font-size:18px;font-weight:bold;text-align:right;">${(order.totalPrice || order.totalAmount || 0).toFixed(2)} TL</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Teslimat Adresi -->
        <tr>
          <td style="padding:0 30px 20px;">
            <p style="margin:0 0 5px;font-size:13px;color:#888;">Teslimat Adresi:</p>
            <p style="margin:0;font-size:14px;color:#333;">${order.shippingAddress || '-'}</p>
          </td>
        </tr>

        ${emailFooter()}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function abandonedCartTemplate(customerName, cartItems, cartTotal) {
  const itemRows = cartItems.map(item => {
    const name = item.product?.name || item.productName || 'Ürün';
    const image = item.product?.image || item.product?.images?.[0] || '';
    const price = item.price || item.product?.price || 0;
    const qty = item.quantity || 1;
    return productRow(name, image, qty, price * qty);
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">

        ${emailHeader()}

        <!-- Mesaj -->
        <tr>
          <td style="padding:30px 30px 20px;">
            <h2 style="margin:0 0 15px;color:#4a7c59;font-size:20px;">Sepetinizde ürünler sizi bekliyor!</h2>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
              Merhaba <strong>${customerName}</strong>,<br><br>
              Sepetinize eklediğiniz ürünleri fark ettik ve hatırlatmak istedik. Patili dostunuz için seçtiğiniz bu güzel ürünler hâlâ sizi bekliyor! Siparişinizi tamamlayın, tüylü arkadaşınız lezzetli ve sağlıklı mamalarına kavuşsun.
            </p>
          </td>
        </tr>

        <!-- Ürünler -->
        <tr>
          <td style="padding:0 30px 10px;">
            <h3 style="margin:0 0 10px;color:#333;font-size:16px;">Sepetinizdeki Ürünler</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
          </td>
        </tr>

        <!-- Toplam -->
        <tr>
          <td style="padding:10px 30px;">
            <table width="100%" style="background-color:#f8f6f0;border-radius:8px;">
              <tr>
                <td style="padding:15px 20px;font-size:16px;font-weight:bold;color:#333;">Toplam:</td>
                <td style="padding:15px 20px;font-size:16px;font-weight:bold;color:#4a7c59;text-align:right;">${cartTotal.toFixed(2)} TL</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:25px 30px;text-align:center;">
            <a href="https://october4mama.tr" style="display:inline-block;background-color:#4a7c59;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">
              Sepetime Dön
            </a>
          </td>
        </tr>

        <!-- Alt Mesaj -->
        <tr>
          <td style="padding:0 30px 10px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">Tüm siparişlerde kargo tamamen ücretsizdir.</p>
          </td>
        </tr>

        ${emailFooter()}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function abandonedOrderTemplate(customerName, order) {
  const itemRows = (order.items || []).map(item => {
    const name = item.productName || item.product?.name || 'Ürün';
    const image = item.product?.image || item.product?.images?.[0] || '';
    const subtotal = item.subtotal || (item.price * item.quantity);
    return productRow(name, image, item.quantity, subtotal);
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;">

        ${emailHeader()}

        <!-- Mesaj -->
        <tr>
          <td style="padding:30px 30px 20px;">
            <h2 style="margin:0 0 15px;color:#4a7c59;font-size:20px;">Ödemeniz tamamlanmadı!</h2>
            <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
              Merhaba <strong>${customerName}</strong>,<br><br>
              Siparişinizi oluşturdunuz ancak ödeme işlemi tamamlanamadı. Endişelenmeyin, seçtiğiniz ürünler hâlâ sizin için ayrılmış durumda! Aşağıdaki butona tıklayarak siparişinizi kolayca tamamlayabilirsiniz.
            </p>
          </td>
        </tr>

        <!-- Ürünler -->
        <tr>
          <td style="padding:0 30px 10px;">
            <h3 style="margin:0 0 10px;color:#333;font-size:16px;">Siparişiniz</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
            </table>
          </td>
        </tr>

        <!-- Toplam -->
        <tr>
          <td style="padding:10px 30px;">
            <table width="100%" style="background-color:#f8f6f0;border-radius:8px;">
              <tr>
                <td style="padding:15px 20px;font-size:16px;font-weight:bold;color:#333;">Toplam:</td>
                <td style="padding:15px 20px;font-size:16px;font-weight:bold;color:#4a7c59;text-align:right;">${(order.totalPrice || 0).toFixed(2)} TL</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:25px 30px;text-align:center;">
            <a href="https://october4mama.tr" style="display:inline-block;background-color:#4a7c59;color:#ffffff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">
              Siparişi Tamamla
            </a>
          </td>
        </tr>

        <!-- Alt Mesaj -->
        <tr>
          <td style="padding:0 30px 10px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#888;">Tüm siparişlerde kargo tamamen ücretsizdir.</p>
          </td>
        </tr>

        ${emailFooter()}

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ===================== EMAIL GONDERME FONKSIYONLARI =====================

/**
 * Siparis onay emaili gonder
 */
async function sendOrderConfirmationEmail(order) {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');

    // Populated order al (urun resimleri icin)
    const populatedOrder = await Order.findById(order._id).populate('items.product');
    if (!populatedOrder) return false;

    let email, customerName;
    if (populatedOrder.user) {
      const user = await User.findById(populatedOrder.user);
      email = user?.email;
      customerName = user?.fullName || 'Değerli Müşterimiz';
    } else if (populatedOrder.guestInfo) {
      email = populatedOrder.guestInfo.email;
      customerName = populatedOrder.guestInfo.fullName || 'Değerli Müşterimiz';
    }

    if (!email) return false;

    const html = orderConfirmationTemplate(populatedOrder, customerName);
    return await sendEmail({
      to: email,
      subject: `Siparişinizi Aldık! #${populatedOrder.orderNumber || populatedOrder._id}`,
      html,
    });
  } catch (error) {
    console.error('Siparis onay emaili hatasi:', error.message);
    return false;
  }
}

/**
 * Terk edilen sepet emaili gonder
 */
async function sendAbandonedCartEmail(user, cart) {
  try {
    if (!user?.email) return false;

    const cartTotal = cart.items.reduce((sum, item) => {
      const price = item.price || item.product?.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    const html = abandonedCartTemplate(user.fullName || 'Değerli Müşterimiz', cart.items, cartTotal);
    return await sendEmail({
      to: user.email,
      subject: 'Sepetinizde ürünler sizi bekliyor!',
      html,
    });
  } catch (error) {
    console.error('Abandoned cart email hatasi:', error.message);
    return false;
  }
}

/**
 * Tamamlanmamis siparis hatirlatma emaili gonder
 */
async function sendAbandonedOrderEmail(email, customerName, order) {
  try {
    if (!email) return false;

    const html = abandonedOrderTemplate(customerName || 'Değerli Müşterimiz', order);
    return await sendEmail({
      to: email,
      subject: `Siparişiniz tamamlanmadı - #${order.orderNumber || order._id}`,
      html,
    });
  } catch (error) {
    console.error('Abandoned order email hatasi:', error.message);
    return false;
  }
}

// ===================== CRON: ABANDONED CART CHECKER =====================

/**
 * Her 30 dakikada calisir: terk edilen sepetleri ve tamamlanmamis siparisleri kontrol eder
 */
async function checkAbandonedCartsAndOrders() {
  const Cart = require('../models/Cart');
  const Order = require('../models/Order');
  const User = require('../models/User');

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // --- Senaryo A: Odemesi tamamlanmamis siparisler ---
  try {
    const pendingOrders = await Order.find({
      paymentStatus: 'beklemede',
      createdAt: { $gt: fortyEightHoursAgo, $lt: thirtyMinAgo },
      notes: { $not: /REMINDER_SENT/ },
    }).populate('items.product');

    for (const order of pendingOrders) {
      let email = null;
      let name = null;

      if (order.user) {
        const user = await User.findById(order.user);
        email = user?.email;
        name = user?.fullName;
      } else if (order.guestInfo?.email) {
        email = order.guestInfo.email;
        name = order.guestInfo.fullName;
      }

      if (!email) continue;

      const sent = await sendAbandonedOrderEmail(email, name, order);
      if (sent) {
        order.notes = ((order.notes || '') + ' REMINDER_SENT').trim();
        await order.save();
        console.log(`Abandoned order hatirlatma gonderildi: ${email} - #${order.orderNumber}`);
      }
    }
  } catch (error) {
    console.error('Abandoned order check hatasi:', error.message);
  }

  // --- Senaryo B: Sepette urun birakip hic siparis olusturmayanlar ---
  try {
    const abandonedCarts = await Cart.find({
      'items.0': { $exists: true },
      updatedAt: { $lt: thirtyMinAgo },
      $and: [
        { $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lt: oneDayAgo } }] },
        { $or: [{ notificationCount: { $exists: false } }, { notificationCount: { $lt: 3 } }] },
      ],
    }).populate('items.product');

    for (const cart of abandonedCarts) {
      const user = await User.findById(cart.user);
      if (!user?.email) continue;

      // Kullanici bu sepet aktivitesinden sonra siparis verdiyse atla
      const recentOrder = await Order.findOne({
        user: cart.user,
        paymentStatus: 'ödendi',
        createdAt: { $gt: cart.updatedAt },
      });
      if (recentOrder) continue;

      const sent = await sendAbandonedCartEmail(user, cart);
      if (sent) {
        cart.lastNotifiedAt = new Date();
        cart.notificationCount = (cart.notificationCount || 0) + 1;
        await cart.save();
        console.log(`Abandoned cart hatirlatma gonderildi: ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Abandoned cart check hatasi:', error.message);
  }
}

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendAbandonedCartEmail,
  sendAbandonedOrderEmail,
  checkAbandonedCartsAndOrders,
};
