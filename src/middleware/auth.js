const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama ve kullanıcı yetkilendirme
exports.protect = async (req, res, next) => {
  let token;

  // Token'ı header'dan al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Token yoksa hata döndür
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlem için giriş yapmanız gerekiyor'
    });
  }

  try {
    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı veritabanından al
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz veya süresi dolmuş token'
    });
  }
};

// Opsiyonel auth - giriş yapmış kullanıcıyı tanır, yoksa da devam eder
exports.optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token geçersiz - misafir olarak devam et
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

// Admin yetkisi kontrolü
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gerekiyor'
    });
  }
};

// JWT token oluştur
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
