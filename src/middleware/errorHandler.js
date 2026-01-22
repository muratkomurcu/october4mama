// Hata yakalama middleware'i
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Console'a log yazdır (development için)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  }

  // Mongoose geçersiz ObjectId hatası
  if (err.name === 'CastError') {
    const message = 'Kayıt bulunamadı';
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key hatası
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Bu ${field} zaten kullanılıyor`;
    error = { statusCode: 400, message };
  }

  // Mongoose validation hatası
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  // JWT hatası
  if (err.name === 'JsonWebTokenError') {
    const message = 'Geçersiz token';
    error = { statusCode: 401, message };
  }

  // JWT süresi dolma hatası
  if (err.name === 'TokenExpiredError') {
    const message = 'Token süresi doldu';
    error = { statusCode: 401, message };
  }

  res.status(error.statusCode || err.statusCode || 500).json({
    success: false,
    message: error.message || err.message || 'Sunucu hatası',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
