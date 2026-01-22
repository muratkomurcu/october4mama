const { validationResult } = require('express-validator');

// Validation sonuçlarını kontrol et
exports.validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);

    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: errorMessages
    });
  }

  next();
};
