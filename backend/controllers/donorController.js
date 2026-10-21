const User = require('../models/User');
const DonationHistory = require('../models/DonationHistory');
const { COOLDOWN_DAYS } = require('../utils/constants');
const { donorWithLinks } = require('../utils/contact');
const { publicUser } = require('./authController');
const { localityFilter } = require('../utils/search');
const { donorGroupsFor } = require('../utils/bloodCompatibility');

// GET /api/donors?bloodGroup=&locality=&available=true&page=1&limit=20
exports.getDonors = async (req, res, next) => {
  try {
    const { bloodGroup, compatibleWith, locality, available } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const filter = { role: 'donor' };
    if (compatibleWith) filter.bloodGroup = { $in: donorGroupsFor(compatibleWith) }; // donors who can give to this patient
    else if (bloodGroup) filter.bloodGroup = bloodGroup; // exact group
    if (locality && locality.trim()) filter.locality = localityFilter(locality);
    if (available === 'true') filter.isAvailable = true;

    const [donors, total] = await Promise.all([
      User.find(filter)
        .select('name phone bloodGroup locality city isAvailable isVerified lastDonatedDate')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ total, page, limit, donors: donors.map(donorWithLinks) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/donors/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'bloodGroup', 'locality', 'city', 'pincode'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) req.user[k] = req.body[k];
    });
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/donors/availability
exports.toggleAvailability = async (req, res, next) => {
  try {
    const user = req.user;
    // a donor who donated recently cannot switch back on until the cooldown ends
    if (!user.isAvailable && user.lastDonatedDate) {
      const days = (Date.now() - user.lastDonatedDate.getTime()) / 86400000;
      if (days < COOLDOWN_DAYS) {
        return res.status(400).json({
          message: `Cooldown active: ${Math.ceil(COOLDOWN_DAYS - days)} day(s) remaining`,
          daysRemaining: Math.ceil(COOLDOWN_DAYS - days)
        });
      }
    }
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/donors/donated   body: { sosRequestId? }
exports.markDonated = async (req, res, next) => {
  try {
    req.user.lastDonatedDate = new Date();
    req.user.isAvailable = false;
    await req.user.save();
    await DonationHistory.create({
      donorId: req.user._id,
      sosRequestId: req.body.sosRequestId || undefined
    });
    res.json({
      message: `Donation recorded. You are unavailable for ${COOLDOWN_DAYS} days.`,
      user: publicUser(req.user)
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/donors/history  (the logged-in donor's donations)
exports.getMyDonations = async (req, res, next) => {
  try {
    const list = await DonationHistory.find({ donorId: req.user._id })
      .populate('sosRequestId', 'patientName hospitalName bloodGroupNeeded')
      .sort({ donationDate: -1 });
    res.json(
      list.map((d) => ({
        id: d._id,
        donatedAt: d.donationDate,
        verified: d.verified,
        patientName: d.sosRequestId ? d.sosRequestId.patientName : undefined,
        hospitalName: d.sosRequestId ? d.sosRequestId.hospitalName : undefined,
        bloodGroup: d.sosRequestId ? d.sosRequestId.bloodGroupNeeded : undefined
      }))
    );
  } catch (err) {
    next(err);
  }
};
