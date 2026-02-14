const ExternalSale = require('../models/ExternalSale');

// Tum dis satislari listele (filtreli)
exports.getExternalSales = async (req, res, next) => {
  try {
    const { platform, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (platform && platform !== 'Tümü') {
      filter.platform = platform;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      ExternalSale.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ExternalSale.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: sales,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Ozet istatistikler (ciro, kar, adet, platform dagilimi)
exports.getExternalSaleSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
        totalCost: { $sum: { $multiply: ['$purchasePrice', '$quantity'] } },
        totalProfit: { $sum: '$profit' },
        totalQuantity: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    });

    const [summary] = await ExternalSale.aggregate(pipeline);

    // Platform bazli dagilim
    const platformPipeline = [];
    if (Object.keys(matchStage).length > 0) {
      platformPipeline.push({ $match: matchStage });
    }
    platformPipeline.push({
      $group: {
        _id: '$platform',
        revenue: { $sum: { $multiply: ['$salePrice', '$quantity'] } },
        profit: { $sum: '$profit' },
        quantity: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    });

    const platformStats = await ExternalSale.aggregate(platformPipeline);

    const result = summary || {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalQuantity: 0,
      count: 0
    };

    // Kar marji hesapla
    result.profitMargin = result.totalRevenue > 0
      ? ((result.totalProfit / result.totalRevenue) * 100).toFixed(1)
      : 0;

    result.platformStats = platformStats;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Yeni dis satis ekle
exports.createExternalSale = async (req, res, next) => {
  try {
    const sale = await ExternalSale.create(req.body);
    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// Dis satisi guncelle
exports.updateExternalSale = async (req, res, next) => {
  try {
    const sale = await ExternalSale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış kaydı bulunamadı'
      });
    }

    Object.assign(sale, req.body);
    await sale.save();

    res.json({
      success: true,
      data: sale
    });
  } catch (error) {
    next(error);
  }
};

// Dis satisi sil
exports.deleteExternalSale = async (req, res, next) => {
  try {
    const sale = await ExternalSale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Satış kaydı bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Satış kaydı silindi'
    });
  } catch (error) {
    next(error);
  }
};
