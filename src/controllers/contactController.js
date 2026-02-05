const Contact = require('../models/Contact');

// @desc    İletişim mesajı gönder
// @route   POST /api/contact
// @access  Public
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = await Contact.create({ name, email, subject, message });

    res.status(201).json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi',
      data: { id: contact._id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilemedi',
      error: error.message
    });
  }
};

// @desc    Tüm mesajları getir (Admin)
// @route   GET /api/contact
// @access  Private/Admin
exports.getMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Mesajlar getirilemedi',
      error: error.message
    });
  }
};

// @desc    Mesajı okundu olarak işaretle (Admin)
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
exports.markAsRead = async (req, res) => {
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj bulunamadı' });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'İşlem başarısız', error: error.message });
  }
};

// @desc    Mesajı sil (Admin)
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Mesaj bulunamadı' });
    }

    res.json({ success: true, message: 'Mesaj silindi' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Silme başarısız', error: error.message });
  }
};
