const Coupon = require('../models/Coupon');

// Admin: Tum kuponlari listele
exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (error) {
    next(error);
  }
};

// Admin: Yeni kupon olustur
exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kodu zaten mevcut'
      });
    }
    next(error);
  }
};

// Admin: Kupon guncelle
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı'
      });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon kodu zaten mevcut'
      });
    }
    next(error);
  }
};

// Admin: Kupon sil
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Kupon bulunamadı'
      });
    }

    res.json({ success: true, message: 'Kupon silindi' });
  } catch (error) {
    next(error);
  }
};

// Public: Kupon dogrula
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Kupon kodu gerekli'
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Geçersiz kupon kodu'
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Bu kupon aktif değil'
      });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Bu kuponun kullanım limiti dolmuş'
      });
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Bu kuponun süresi dolmuş'
      });
    }

    // Indirim miktarini hesapla
    let discountAmount = 0;
    if (coupon.discountType === 'fixed') {
      discountAmount = coupon.discountValue;
    } else {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
    }

    // Indirim sepet toplamini gecemez
    discountAmount = Math.min(discountAmount, cartTotal);

    res.json({
      success: true,
      data: {
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        remainingUses: coupon.maxUses - coupon.usedCount
      }
    });
  } catch (error) {
    next(error);
  }
};
