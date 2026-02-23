const Review = require('../models/Review');
const Order = require('../models/Order');

// @desc    Ürünün yorumlarını getir
// @route   GET /api/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const avgRating = count > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
      : null;

    res.status(200).json({
      success: true,
      count,
      avgRating,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Yorum ekle
// @route   POST /api/reviews/:productId
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    // Satın alma kontrolü
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': req.params.productId,
      paymentStatus: 'ödendi'
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'Yorum yapabilmek için bu ürünü satın almış olmanız gerekir.'
      });
    }

    // Duplikat yorum kontrolü
    const existing = await Review.findOne({
      product: req.params.productId,
      user: req.user._id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürüne zaten bir yorum yaptınız.'
      });
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      rating,
      comment
    });

    await review.populate('user', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Yorumunuz eklendi',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Yorum sil (Admin)
// @route   DELETE /api/reviews/:reviewId
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Yorum silindi'
    });
  } catch (error) {
    next(error);
  }
};
