const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.companyName) updates.companyName = req.body.companyName;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.address) updates.address = req.body.address;
    if (req.file) updates.logo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        logo: user.logo
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};
