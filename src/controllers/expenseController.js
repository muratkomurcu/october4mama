const Expense = require('../models/Expense');

// Tum giderleri listele
exports.getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    const filter = {};
    if (category && category !== 'Tümü') filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({ success: true, data: expenses, totalAmount });
  } catch (error) {
    next(error);
  }
};

// Gider ozeti (toplam tutar, kategori dagilimi)
exports.getExpenseSummary = async (req, res, next) => {
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
    if (Object.keys(matchStage).length > 0) pipeline.push({ $match: matchStage });
    pipeline.push({
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    });

    const [categoryStats, totalResult] = await Promise.all([
      Expense.aggregate(pipeline),
      Expense.aggregate([
        ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalAmount: totalResult[0]?.total || 0,
        count: totalResult[0]?.count || 0,
        categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Yeni gider ekle
exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// Gider guncelle
exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Gider bulunamadı' });
    Object.assign(expense, req.body);
    await expense.save();
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// Gider sil
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Gider bulunamadı' });
    res.json({ success: true, message: 'Gider silindi' });
  } catch (error) {
    next(error);
  }
};
