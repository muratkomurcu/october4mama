const Pet = require('../models/Pet');
const User = require('../models/User');

// @desc    Kullanıcının tüm petlerini getir
// @route   GET /api/pets
// @access  Private
exports.getMyPets = async (req, res, next) => {
  try {
    const pets = await Pet.find({ user: req.user.id });
    res.status(200).json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

// @desc    Yeni pet ekle
// @route   POST /api/pets
// @access  Private
exports.addPet = async (req, res, next) => {
  try {
    const {
      petType, petName, petBreed,
      petWeight, petAge,
      birthDate, gender, isNeutered, healthNotes
    } = req.body;

    const pet = await Pet.create({
      user: req.user.id,
      petType, petName, petBreed,
      petWeight: parseFloat(petWeight),
      petAge: parseFloat(petAge),
      birthDate: birthDate || undefined,
      gender: gender || 'bilinmiyor',
      isNeutered: isNeutered === true || isNeutered === 'true',
      healthNotes: healthNotes || undefined
    });

    await User.findByIdAndUpdate(req.user.id, { $push: { pets: pet._id } });

    res.status(201).json({
      success: true,
      message: 'Evcil hayvan eklendi',
      data: pet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pet güncelle
// @route   PUT /api/pets/:id
// @access  Private
exports.updatePet = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    const allowedFields = ['petType', 'petName', 'petBreed', 'birthDate', 'gender', 'isNeutered', 'healthNotes'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) pet[field] = req.body[field];
    });

    if (req.body.petWeight !== undefined) pet.petWeight = parseFloat(req.body.petWeight);
    if (req.body.petAge !== undefined) pet.petAge = parseFloat(req.body.petAge);
    if (req.body.isNeutered !== undefined) pet.isNeutered = req.body.isNeutered === true || req.body.isNeutered === 'true';

    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Evcil hayvan güncellendi',
      data: pet
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pet sil
// @route   DELETE /api/pets/:id
// @access  Private
exports.deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    await Pet.deleteOne({ _id: pet._id });
    await User.findByIdAndUpdate(req.user.id, { $pull: { pets: pet._id } });

    res.status(200).json({ success: true, message: 'Evcil hayvan silindi' });
  } catch (error) {
    next(error);
  }
};

// @desc    Aşı kaydı ekle
// @route   POST /api/pets/:id/vaccinations
// @access  Private
exports.addVaccination = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    const { name, date, nextDueDate } = req.body;
    if (!name || !date) {
      return res.status(400).json({ success: false, message: 'Aşı adı ve tarih gereklidir' });
    }

    pet.vaccinations.push({ name, date, nextDueDate: nextDueDate || undefined });
    await pet.save();

    res.status(201).json({ success: true, message: 'Aşı kaydı eklendi', data: pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Aşı kaydı sil
// @route   DELETE /api/pets/:id/vaccinations/:vacId
// @access  Private
exports.deleteVaccination = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    pet.vaccinations = pet.vaccinations.filter(v => v._id.toString() !== req.params.vacId);
    await pet.save();

    res.status(200).json({ success: true, message: 'Aşı kaydı silindi', data: pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Parazit tedavisi ekle
// @route   POST /api/pets/:id/treatments
// @access  Private
exports.addTreatment = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    const { type, date, nextDueDate } = req.body;
    if (!type || !date) {
      return res.status(400).json({ success: false, message: 'Tedavi türü ve tarih gereklidir' });
    }

    pet.treatments.push({ type, date, nextDueDate: nextDueDate || undefined });
    await pet.save();

    res.status(201).json({ success: true, message: 'Tedavi kaydı eklendi', data: pet });
  } catch (error) {
    next(error);
  }
};

// @desc    Parazit tedavisi sil
// @route   DELETE /api/pets/:id/treatments/:trtId
// @access  Private
exports.deleteTreatment = async (req, res, next) => {
  try {
    const pet = await Pet.findOne({ _id: req.params.id, user: req.user.id });
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Evcil hayvan bulunamadı' });
    }

    pet.treatments = pet.treatments.filter(t => t._id.toString() !== req.params.trtId);
    await pet.save();

    res.status(200).json({ success: true, message: 'Tedavi kaydı silindi', data: pet });
  } catch (error) {
    next(error);
  }
};
