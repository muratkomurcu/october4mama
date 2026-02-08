const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Kullanıcının sepetini getir
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      // Sepet yoksa boş sepet oluştur
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sepete ürün ekle
// @route   POST /api/cart/items
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    // Ürünü kontrol et
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    // Stok kontrolü
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün stokta yok'
      });
    }

    // Kullanıcının sepetini bul veya oluştur
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
    }

    // Ürün sepette var mı kontrol et
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Ürün varsa miktarı güncelle
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Ürün yoksa sepete ekle
      cart.items.push({
        product: productId,
        quantity: quantity || 1,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Ürün sepete eklendi',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sepetteki ürünü güncelle
// @route   PUT /api/cart/items/:productId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Miktar en az 1 olmalıdır'
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ürün sepette bulunamadı'
      });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Sepet güncellendi',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Sepetten ürün sil
// @route   DELETE /api/cart/items/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: 'Ürün sepetten çıkarıldı',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Frontend sepetini backend'e senkronize et
// @route   PUT /api/cart/sync
// @access  Private
exports.syncCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const validItems = [];
    for (const item of (items || [])) {
      const product = await Product.findById(item.id);
      if (product) {
        validItems.push({
          product: product._id,
          quantity: item.quantity || 1,
          price: product.price,
        });
      }
    }

    cart.items = validItems;
    await cart.save();

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
};

// @desc    Sepeti temizle
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Sepet bulunamadı'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Sepet temizlendi',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};
