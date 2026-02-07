const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

let Iyzipay;
try {
  Iyzipay = require('iyzipay');
} catch (e) {
  console.log('iyzipay paketi yüklenemedi:', e.message);
}

// iyzico instance'ı lazy olarak oluştur (sunucu açılışında değil)
let iyzipayInstance = null;
function getIyzipay() {
  if (!iyzipayInstance && Iyzipay) {
    iyzipayInstance = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY,
      secretKey: process.env.IYZICO_SECRET_KEY,
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
    });
  }
  return iyzipayInstance;
}

// @desc    iyzico Checkout Form başlat
// @route   POST /api/payment/initialize
// @access  Private
exports.initializeCheckoutForm = async (req, res) => {
  try {
    const { customer, shippingAddress, items } = req.body;

    const iyzipay = getIyzipay();
    if (!iyzipay) {
      return res.status(503).json({
        success: false,
        message: 'Ödeme sistemi şu anda kullanılamıyor'
      });
    }

    if (!customer || !shippingAddress || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Eksik sipariş bilgileri'
      });
    }

    // Fiyatları veritabanından doğrula
    const productIds = items.map(item => item.id);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Bazı ürünler bulunamadı'
      });
    }

    const orderItems = items.map(item => {
      const dbProduct = products.find(p => p._id.toString() === item.id);
      if (!dbProduct) {
        throw new Error(`Ürün bulunamadı: ${item.name}`);
      }
      // Stok kontrolü
      if (dbProduct.stockQuantity < item.quantity) {
        throw new Error(`${dbProduct.name} için yeterli stok yok`);
      }
      return {
        product: dbProduct._id,
        productName: dbProduct.name,
        quantity: item.quantity,
        price: dbProduct.price,
        subtotal: dbProduct.price * item.quantity
      };
    });

    const productTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingCost = productTotal >= 500 ? 0 : 29.99;

    // Sepet kalemleri (iyzico formatı)
    const basketItems = orderItems.map(item => ({
      id: item.product.toString(),
      name: item.productName,
      category1: 'Pet Mama',
      itemType: Iyzipay?.BASKET_ITEM_TYPE?.PHYSICAL || 'PHYSICAL',
      price: item.subtotal.toFixed(2)
    }));

    // Kargo ücreti varsa sepete ekle
    if (shippingCost > 0) {
      basketItems.push({
        id: 'SHIPPING',
        name: 'Kargo Ücreti',
        category1: 'Kargo',
        itemType: Iyzipay?.BASKET_ITEM_TYPE?.VIRTUAL || 'VIRTUAL',
        price: shippingCost.toFixed(2)
      });
    }

    const totalPrice = productTotal + shippingCost;

    // Sipariş oluştur (beklemede)
    const shippingAddressStr = `${shippingAddress.address}, ${shippingAddress.district}, ${shippingAddress.city} ${shippingAddress.postalCode || ''}`.trim();

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice,
      shippingAddress: shippingAddressStr,
      shippingCost,
      paymentMethod: 'kredi_kartı',
      paymentStatus: 'beklemede',
      orderStatus: 'hazırlanıyor'
    });

    // Buyer bilgileri
    const nameParts = customer.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : firstName;

    // Telefon numarasını +90 formatına çevir
    let phone = customer.phone.replace(/\s/g, '');
    if (!phone.startsWith('+')) {
      phone = '+90' + phone.replace(/^0/, '');
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '127.0.0.1';

    const apiBaseUrl = process.env.API_BASE_URL || `https://october4mama.onrender.com`;

    const request = {
      locale: Iyzipay?.LOCALE?.TR || 'tr',
      conversationId: order.orderNumber,
      price: totalPrice.toFixed(2),
      paidPrice: totalPrice.toFixed(2),
      currency: Iyzipay?.CURRENCY?.TRY || 'TRY',
      basketId: order._id.toString(),
      paymentGroup: Iyzipay?.PAYMENT_GROUP?.PRODUCT || 'PRODUCT',
      callbackUrl: `${apiBaseUrl}/api/payment/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: req.user.id,
        name: firstName,
        surname: lastName,
        gsmNumber: phone,
        email: customer.email,
        identityNumber: '11111111111',
        registrationAddress: shippingAddressStr,
        ip: clientIp,
        city: shippingAddress.city,
        country: 'Turkey',
        zipCode: shippingAddress.postalCode || '34000'
      },
      shippingAddress: {
        contactName: customer.fullName,
        city: shippingAddress.city,
        country: 'Turkey',
        address: shippingAddressStr,
        zipCode: shippingAddress.postalCode || '34000'
      },
      billingAddress: {
        contactName: customer.fullName,
        city: shippingAddress.city,
        country: 'Turkey',
        address: shippingAddressStr,
        zipCode: shippingAddress.postalCode || '34000'
      },
      basketItems
    };

    // iyzico checkout form başlat
    iyzipay.checkoutFormInitialize.create(request, async (err, result) => {
      if (err) {
        // Hata durumunda siparişi sil
        await Order.findByIdAndDelete(order._id);
        return res.status(500).json({
          success: false,
          message: 'Ödeme sistemi hatası'
        });
      }

      if (result.status === 'success') {
        // Token'ı siparişe kaydet
        order.paymentDetails = {
          conversationId: order.orderNumber,
          paymentId: result.token
        };
        await order.save();

        return res.json({
          success: true,
          checkoutFormContent: result.checkoutFormContent,
          token: result.token,
          orderId: order._id,
          orderNumber: order.orderNumber
        });
      } else {
        // Hata durumunda siparişi sil
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({
          success: false,
          message: result.errorMessage || 'Ödeme formu oluşturulamadı'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Ödeme başlatılamadı'
    });
  }
};

// @desc    iyzico ödeme callback
// @route   POST /api/payment/callback
// @access  Public (iyzico tarafından çağrılır)
exports.checkoutFormCallback = async (req, res) => {
  try {
    const { token } = req.body;

    const iyzipay = getIyzipay();
    if (!token || !iyzipay) {
      const clientUrl = process.env.CLIENT_URL || 'https://october4mama.tr';
      return res.redirect(`${clientUrl}/payment?status=failed`);
    }

    iyzipay.checkoutForm.retrieve({
      locale: Iyzipay?.LOCALE?.TR || 'tr',
      token: token
    }, async (err, result) => {
      const clientUrl = process.env.CLIENT_URL || 'https://october4mama.tr';

      if (err) {
        return res.redirect(`${clientUrl}/payment?status=failed`);
      }

      // Siparişi bul
      const order = await Order.findOne({ 'paymentDetails.paymentId': token });

      if (result.paymentStatus === 'SUCCESS') {
        if (order) {
          order.paymentStatus = 'ödendi';
          order.paymentDetails = {
            conversationId: result.conversationId,
            paymentId: result.paymentId,
            transactionId: result.paymentId
          };
          await order.save();

          // Stokları güncelle
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stockQuantity: -item.quantity }
            });
          }

          // WhatsApp bildirimi
          try {
            const { sendOrderNotification } = require('../services/whatsappService');
            const user = await User.findById(order.user);
            sendOrderNotification({
              ...order.toObject(),
              user,
              totalAmount: order.totalPrice
            }).catch(() => {});
          } catch (e) {
            // Bildirim hatası siparişi etkilemez
          }
        }

        return res.redirect(`${clientUrl}/payment?status=success&orderNumber=${order?.orderNumber || ''}`);
      } else {
        if (order) {
          order.paymentStatus = 'iptal';
          await order.save();
        }

        return res.redirect(`${clientUrl}/payment?status=failed`);
      }
    });
  } catch (error) {
    const clientUrl = process.env.CLIENT_URL || 'https://october4mama.tr';
    return res.redirect(`${clientUrl}/payment?status=failed`);
  }
};

// @desc    Ödeme durumunu sorgula
// @route   GET /api/payment/status/:orderNumber
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Kullanıcı kendi siparişini görebilir veya admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi görme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ödeme durumu sorgulanamadı'
    });
  }
};
