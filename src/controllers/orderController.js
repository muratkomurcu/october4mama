const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

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

    // Sipariş kalemlerini hazırla
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }));

    // Toplam fiyatı hesapla
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
    const orders = await Order.find({ user: req.user.id })
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
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
    const orders = await Order.find()
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

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Sipariş güncellendi',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
