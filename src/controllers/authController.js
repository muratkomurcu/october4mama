const User = require('../models/User');
const Pet = require('../models/Pet');
const { generateToken } = require('../middleware/auth');

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
