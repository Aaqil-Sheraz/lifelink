const User = require('../models/User');
const SOSRequest = require('../models/SOSRequest');
const { sosWithLinks } = require('../utils/contact');

exports.getStats = async (req, res, next) => {
  try {
    const [donors, verifiedDonors, activeSOS, fulfilled, expired] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'donor', isVerified: true }),
      SOSRequest.countDocuments({ status: 'active', expiresAt: { $gt: new Date() } }),
      SOSRequest.countDocuments({ status: 'fulfilled' }),
      SOSRequest.countDocuments({ status: 'expired' })
    ]);
    res.json({ donors, verifiedDonors, activeSOS, fulfilled, expired });
  } catch (err) {
    next(err);
  }
};

exports.getPendingDonors = async (req, res, next) => {
  try {
    const donors = await User.find({ role: 'donor', isVerified: false })
      .select('name phone bloodGroup locality city createdAt')
      .sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    next(err);
  }
};

exports.verifyDonor = async (req, res, next) => {
  try {
    const donor = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json({ message: 'Donor verified', id: donor._id });
  } catch (err) {
    next(err);
  }
};

// All SOS posts (any status) for moderation
exports.getAllSOS = async (req, res, next) => {
  try {
    const list = await SOSRequest.find().sort({ createdAt: -1 }).limit(200);
    res.json(list.map(sosWithLinks));
  } catch (err) {
    next(err);
  }
};
