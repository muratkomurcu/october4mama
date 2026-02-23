const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Sipariş numarası + e-posta ile genel sorgulama (Public)
// @route   POST /api/orders/track
// @access  Public
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Sipariş numarası ve e-posta adresi zorunludur.'
      });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      paymentStatus: { $ne: 'beklemede' }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.'
      });
    }

    // E-posta doğrulama
    const emailLower = email.toLowerCase().trim();
    let emailMatches = false;

    if (order.guestInfo?.email) {
      emailMatches = order.guestInfo.email.toLowerCase() === emailLower;
    }

    if (!emailMatches && order.user) {
      const owner = await User.findById(order.user).select('email');
      if (owner) emailMatches = owner.email.toLowerCase() === emailLower;
    }

    if (!emailMatches) {
      return res.status(403).json({
        success: false,
        message: 'E-posta adresi bu siparişe ait değil.'
      });
    }

    const statusLabels = {
      'hazırlanıyor':   '📦 Hazırlanıyor – Siparişiniz paketleniyor.',
      'kargoda':        '🚚 Kargoda – Siparişiniz yola çıktı.',
      'teslim edildi':  '✅ Teslim Edildi – Sipariş tamamlandı.',
      'iptal':          '❌ İptal Edildi.'
    };

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        orderStatusLabel: statusLabels[order.orderStatus] || order.orderStatus,
        trackingNumber: order.trackingNumber || null,
        totalPrice: order.totalPrice,
        itemCount: order.items.length,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
const { sendOrderNotification, sendStatusUpdateNotification } = require('../services/whatsappService');

// @desc    Sipariş oluştur
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Kullanıcının sepetini al
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sepetiniz boş'
      });
    }

    // Sipariş kalemlerini hazırla - fiyatları veritabanından doğrula
    const orderItems = cart.items.map(item => {
      const dbPrice = item.product.price; // Veritabanındaki güncel fiyat
      return {
        product: item.product._id,
        productName: item.product.name,
        quantity: item.quantity,
        price: dbPrice,
        subtotal: dbPrice * item.quantity
      };
    });

    // Toplam fiyatı veritabanı fiyatlarından hesapla
    const totalPrice = orderItems.reduce((total, item) => total + item.subtotal, 0);

    // Kargo ücreti hesapla (örnek: 500 TL üzeri ücretsiz)
    const shippingCost = totalPrice >= 500 ? 0 : 29.99;

    // Sipariş oluştur
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalPrice: totalPrice + shippingCost,
      shippingAddress,
      shippingCost,
      paymentMethod
    });

    // Sepeti temizle
    cart.items = [];
    await cart.save();

    // Ürün stoklarını güncelle (opsiyonel)
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    // WhatsApp bildirimi gönder (async, hata olsa bile sipariş tamamlansın)
    try {
      const user = await User.findById(req.user.id);
      const orderWithUser = {
        ...order.toObject(),
        user: user,
        totalAmount: totalPrice + shippingCost
      };
      sendOrderNotification(orderWithUser).catch(err => console.log('WhatsApp bildirim hatası:', err.message));
    } catch (notifError) {
      console.log('WhatsApp bildirim hazırlama hatası:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Sipariş oluşturuldu',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcının siparişlerini getir
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
      paymentStatus: { $ne: 'beklemede' }
    })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tek bir siparişi getir
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    // Kullanıcı kendi siparişini görebilir veya admin görebilir
    const isOwner = order.user && order.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişi görme yetkiniz yok'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tüm siparişleri getir (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    // 48 saatten eski ödenmemiş siparişleri otomatik temizle
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Order.deleteMany({
      paymentStatus: 'beklemede',
      createdAt: { $lt: fortyEightHoursAgo }
    });

    // Sadece ödenen veya durumu değişmiş siparişleri getir (beklemede olanları gösterme)
    const orders = await Order.find({
      paymentStatus: { $ne: 'beklemede' }
    })
      .populate('user', 'fullName email phone')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sipariş durumunu güncelle (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    const oldStatus = order.orderStatus;

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    // Sipariş iptal edildiyse stokları geri ekle
    if (orderStatus === 'iptal' && oldStatus !== 'iptal') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    // Durum değiştiyse WhatsApp bildirimi gönder
    if (orderStatus && orderStatus !== oldStatus) {
      sendStatusUpdateNotification(order, orderStatus).catch(err =>
        console.log('WhatsApp durum bildirim hatası:', err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: 'Sipariş güncellendi',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bekleyen (ödenmemiş) siparişleri getir (Admin)
// @route   GET /api/orders/admin/pending
// @access  Private/Admin
exports.getPendingOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      paymentStatus: 'beklemede'
    })
      .populate('user', 'fullName email phone')
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
