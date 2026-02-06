const Product = require('../models/Product');

// @desc    Tüm ürünleri getir
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const { category, ageGroup, inStock } = req.query;

    // Filtreleme
    const filter = {};
    if (category) filter.category = category;
    if (ageGroup) filter.ageGroup = ageGroup;
    if (inStock !== undefined) filter.inStock = inStock === 'true';

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tek bir ürünü getir
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Yeni ürün ekle (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, ageGroup, price, weight, stockQuantity, description, image, features, inStock } = req.body;
    const product = await Product.create({ name, category, ageGroup, price, weight, stockQuantity, description, image, features, inStock });

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ürün güncelle (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, category, ageGroup, price, weight, stockQuantity, description, image, features, inStock } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
    if (price !== undefined) updateData.price = price;
    if (weight !== undefined) updateData.weight = weight;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (features !== undefined) updateData.features = features;
    if (inStock !== undefined) updateData.inStock = inStock;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ürün güncellendi',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ürün sil (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ürün silindi'
    });
  } catch (error) {
    next(error);
  }
};
