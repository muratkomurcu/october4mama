const crypto = require('crypto');
const User = require('../models/User');
const Pet = require('../models/Pet');
const { generateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// @desc    Kullanıcı kaydı
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      address,
      petType,
      petName,
      petBreed,
      petWeight,
      petAge
    } = req.body;

    // Kullanıcı zaten var mı kontrol et
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi zaten kullanılıyor'
      });
    }

    // Kullanıcı oluştur
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      address
    });

    // Evcil hayvan bilgisi oluştur
    const pet = await Pet.create({
      user: user._id,
      petType,
      petName,
      petBreed,
      petWeight,
      petAge
    });

    // Kullanıcıya pet'i ekle
    user.pets.push(pet._id);
    await user.save();

    // Token oluştur
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role
        },
        pet: {
          id: pet._id,
          petType: pet.petType,
          petName: pet.petName,
          petBreed: pet.petBreed,
          petWeight: pet.petWeight,
          petAge: pet.petAge
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı girişi
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre gereklidir'
      });
    }

    // Kullanıcıyı bul (şifre ile birlikte)
    const user = await User.findOne({ email }).select('+password').populate('pets');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    // Şifre kontrolü
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz e-posta veya şifre'
      });
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin'
      });
    }

    // Token oluştur
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          pets: user.pets
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı profilini getir
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('pets');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          pets: user.pets,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcı profilini güncelle
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        fullName,
        phone,
        address
      },
      {
        new: true,
        runValidators: true
      }
    ).populate('pets');

    res.status(200).json({
      success: true,
      message: 'Profil güncellendi',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Şifremi unuttum - reset token oluştur ve email gönder
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'E-posta adresi gereklidir'
      });
    }

    const user = await User.findOne({ email });

    // Güvenlik: Kullanıcı bulunsun ya da bulunmasın aynı yanıtı ver
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi'
      });
    }

    // Reset token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash'le ve kaydet
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 dakika
    await user.save({ validateBeforeSave: false });

    // Reset URL
    const clientUrl = process.env.CLIENT_URL || 'https://october4mama.tr';
    const resetUrl = `${clientUrl}/sifre-sifirla/${resetToken}`;

    // Email gönder
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;background:#fffaf5;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8B6914,#D4A84B);padding:32px;text-align:center;">
          <img src="https://october4mama.tr/logo.jpeg" alt="October 4" style="width:80px;height:80px;border-radius:50%;border:3px solid rgba(255,255,255,0.3);margin-bottom:12px;" />
          <h1 style="color:#fff;margin:0;font-size:24px;">Şifre Sıfırlama</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#5a4a3a;font-size:16px;line-height:1.6;">
            Merhaba <strong>${user.fullName || 'Değerli Müşterimiz'}</strong>,
          </p>
          <p style="color:#5a4a3a;font-size:16px;line-height:1.6;">
            Hesabınız için şifre sıfırlama talebinde bulunuldu. Aşağıdaki butona tıklayarak yeni şifrenizi oluşturabilirsiniz:
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="background:linear-gradient(135deg,#8B6914,#D4A84B);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
              Şifremi Sıfırla
            </a>
          </div>
          <p style="color:#8a7a6a;font-size:14px;line-height:1.6;">
            Bu bağlantı <strong>30 dakika</strong> süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
        <div style="background:#f5efe8;padding:20px;text-align:center;border-top:1px solid #e8ddd0;">
          <p style="color:#8a7a6a;font-size:13px;margin:0;">October 4 Pet Food | info@october4mama.tr</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'October 4 - Şifre Sıfırlama',
        html
      });
    } catch {
      // Email gönderilemezse token'ı temizle
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Şifre sıfırla
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Token'ı hash'le ve karşılaştır
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş bağlantı. Lütfen tekrar şifre sıfırlama talebinde bulunun'
      });
    }

    // Yeni şifreyi kaydet
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz'
    });
  } catch (error) {
    next(error);
  }
};
