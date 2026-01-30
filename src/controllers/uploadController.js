const { cloudinary } = require('../config/cloudinary');

// @desc    Resim yükle
// @route   POST /api/upload
// @access  Private/Admin
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir resim dosyası seçin'
      });
    }

    // Cloudinary'den dönen URL'i gönder
    res.status(200).json({
      success: true,
      message: 'Resim başarıyla yüklendi',
      data: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resim sil
// @route   DELETE /api/upload/:public_id
// @access  Private/Admin
exports.deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID gerekli'
      });
    }

    // Cloudinary'den resmi sil
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Resim başarıyla silindi'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Resim silinemedi'
      });
    }
  } catch (error) {
    next(error);
  }
};
