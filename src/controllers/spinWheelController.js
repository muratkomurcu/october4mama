const SpinWheel = require('../models/SpinWheel');
const Coupon = require('../models/Coupon');

// 12 visual segments on the wheel (index 0-11, clockwise from top)
const SEGMENTS = [
  { index: 0,  label: '%5 İndirim',   type: 'percentage', value: 5   },
  { index: 1,  label: '%7 İndirim',   type: 'percentage', value: 7   },
  { index: 2,  label: '%10 İndirim',  type: 'percentage', value: 10  },
  { index: 3,  label: '%5 İndirim',   type: 'percentage', value: 5   },
  { index: 4,  label: '50 TL İndirim', type: 'fixed',     value: 50  },
  { index: 5,  label: '%7 İndirim',   type: 'percentage', value: 7   },
  { index: 6,  label: '%5 İndirim',   type: 'percentage', value: 5   },
  { index: 7,  label: '%10 İndirim',  type: 'percentage', value: 10  },
  { index: 8,  label: '%7 İndirim',   type: 'percentage', value: 7   },
  { index: 9,  label: '%5 İndirim',   type: 'percentage', value: 5   },
  { index: 10, label: '100 TL İndirim', type: 'fixed',    value: 100 },
  { index: 11, label: '200 TL İndirim', type: 'fixed',    value: 200 },
];

// Weighted prizes - big discounts are rare
// %5 appears at segments [0,3,6,9], %7 at [1,5,8], %10 at [2,7]
// 50TL at [4], 100TL at [10], 200TL at [11]
const PRIZES = [
  { type: 'percentage', value: 5,   weight: 42, segments: [0, 3, 6, 9] },
  { type: 'percentage', value: 7,   weight: 30, segments: [1, 5, 8]    },
  { type: 'percentage', value: 10,  weight: 15, segments: [2, 7]       },
  { type: 'fixed',      value: 50,  weight: 8,  segments: [4]          },
  { type: 'fixed',      value: 100, weight: 4,  segments: [10]         },
  { type: 'fixed',      value: 200, weight: 1,  segments: [11]         },
];

function weightedRandom() {
  const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const prize of PRIZES) {
    rand -= prize.weight;
    if (rand <= 0) {
      const segIndex = prize.segments[Math.floor(Math.random() * prize.segments.length)];
      return { prize, segmentIndex: segIndex };
    }
  }

  // Fallback
  return { prize: PRIZES[0], segmentIndex: PRIZES[0].segments[0] };
}

function generateCouponCode() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CARK${ts}${rand}`;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// GET /api/spin-wheel/status  (protected)
exports.getStatus = async (req, res, next) => {
  try {
    const record = await SpinWheel.findOne({ userId: req.user._id });

    if (!record) {
      return res.json({ success: true, data: { canSpin: true } });
    }

    const canSpin = !isSameDay(new Date(record.lastSpinDate), new Date());

    res.json({
      success: true,
      data: {
        canSpin,
        lastSpinDate: record.lastSpinDate,
        couponCode: canSpin ? null : record.couponCode,
        prize: canSpin ? null : record.prize,
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/spin-wheel/spin  (protected)
exports.spin = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Check if already spun today
    const existing = await SpinWheel.findOne({ userId });
    if (existing && isSameDay(new Date(existing.lastSpinDate), now)) {
      return res.status(400).json({
        success: false,
        message: 'Bugün zaten çarkı çevirdiniz. Yarın tekrar deneyebilirsiniz!'
      });
    }

    // Pick prize with weighted random
    const { prize, segmentIndex } = weightedRandom();
    const segment = SEGMENTS[segmentIndex];

    // Generate unique coupon code (retry on duplicate)
    let couponCode;
    let attempts = 0;
    while (attempts < 5) {
      couponCode = generateCouponCode();
      const exists = await Coupon.findOne({ code: couponCode });
      if (!exists) break;
      attempts++;
    }

    // Coupon expires in 30 days, single use
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Coupon.create({
      code: couponCode,
      discountType: prize.type,
      discountValue: prize.value,
      maxUses: 1,
      expiresAt,
      isActive: true
    });

    // Save / update spin record
    if (existing) {
      existing.lastSpinDate = now;
      existing.couponCode = couponCode;
      existing.prize = segment.label;
      await existing.save();
    } else {
      await SpinWheel.create({
        userId,
        lastSpinDate: now,
        couponCode,
        prize: segment.label
      });
    }

    res.json({
      success: true,
      data: {
        segmentIndex,
        prize: segment.label,
        couponCode,
        discountType: prize.type,
        discountValue: prize.value
      }
    });
  } catch (error) {
    next(error);
  }
};
