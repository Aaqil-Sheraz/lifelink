const SOSRequest = require('../models/SOSRequest');
const User = require('../models/User');
const { EXPIRY_HOURS } = require('../utils/constants');
const { roomName } = require('../utils/rooms');
const { sosWithLinks } = require('../utils/contact');
const { localityFilter } = require('../utils/search');
const { donorGroupsFor, recipientGroupsOf } = require('../utils/bloodCompatibility');

// POST /api/sos
exports.createSOS = async (req, res, next) => {
  try {
    const {
      patientName, bloodGroupNeeded, unitsNeeded, hospitalName, hospitalAddress,
      locality, urgency = 'critical', contactName, contactPhone, relation
    } = req.body;

    const expiresAt = new Date(Date.now() + EXPIRY_HOURS[urgency] * 60 * 60 * 1000);

    const sos = await SOSRequest.create({
      createdBy: req.user._id,
      requestedBy: {
        name: contactName || req.user.name,
        phone: contactPhone || req.user.phone,
        relation
      },
      patientName, bloodGroupNeeded, unitsNeeded, hospitalName, hospitalAddress,
      locality, urgency, expiresAt
    });

    // match donors: compatible blood group (O- can give to anyone, O+ to all positive groups, ...),
    // same locality (case-insensitive), available now
    const compatibleGroups = donorGroupsFor(bloodGroupNeeded);
    const matchedDonors = await User.countDocuments({
      role: 'donor',
      bloodGroup: { $in: compatibleGroups },
      locality: locality.trim(),
      isAvailable: true,
      _id: { $ne: req.user._id }
    }).collation({ locale: 'en', strength: 2 });

    const payload = { ...sosWithLinks(sos), compatibleGroups };

    // broadcast only to donors subscribed to this locality + blood group room
    const io = req.app.get('io');
    // one room per compatible donor group in that locality
    const rooms = compatibleGroups.map((g) => roomName(locality, g));
    io.to(rooms).emit('sos:new', payload);

    // how many other donors are connected (logged in, app open) in that room right now
    const sockets = await io.in(rooms).fetchSockets();
    const alertedOnline = sockets.filter(
      (s) => String(s.user && s.user._id) !== String(req.user._id)
    ).length;
    console.log(`[sos] needs ${bloodGroupNeeded} in "${locality}" -> donors ${compatibleGroups.join(', ')}: ${matchedDonors} matching donor(s), ${alertedOnline} online and alerted`);

    res.status(201).json({ sos: payload, matchedDonors, alertedOnline, compatibleGroups });
  } catch (err) {
    next(err);
  }
};

// GET /api/sos/active?bloodGroup=&locality=
exports.getActiveSOS = async (req, res, next) => {
  try {
    const { bloodGroup, locality, canDonate } = req.query;
    const filter = { status: 'active', expiresAt: { $gt: new Date() } };
    const needed = [];
    if (bloodGroup) needed.push({ bloodGroupNeeded: bloodGroup });
    // canDonate=O+ -> only requests that an O+ donor can actually help with
    if (canDonate) needed.push({ bloodGroupNeeded: { $in: recipientGroupsOf(canDonate) } });
    if (needed.length) filter.$and = needed;
    if (locality && locality.trim()) filter.locality = localityFilter(locality);

    const list = await SOSRequest.find(filter).sort({ createdAt: -1 });
    res.json(list.map(sosWithLinks));
  } catch (err) {
    next(err);
  }
};

// GET /api/sos/mine
exports.getMySOS = async (req, res, next) => {
  try {
    const list = await SOSRequest.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(list.map(sosWithLinks));
  } catch (err) {
    next(err);
  }
};

// GET /api/sos/:id
exports.getSOSById = async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id);
    if (!sos) return res.status(404).json({ message: 'SOS request not found' });
    res.json(sosWithLinks(sos));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/sos/:id/fulfill
exports.fulfillSOS = async (req, res, next) => {
  try {
    const sos = await SOSRequest.findById(req.params.id);
    if (!sos) return res.status(404).json({ message: 'SOS request not found' });

    const isOwner = sos.createdBy.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    sos.status = 'fulfilled';
    await sos.save();

    req.app.get('io').emit('sos:fulfilled', { id: sos._id });
    res.json(sosWithLinks(sos));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/sos/:id  (admin)
exports.deleteSOS = async (req, res, next) => {
  try {
    const sos = await SOSRequest.findByIdAndDelete(req.params.id);
    if (!sos) return res.status(404).json({ message: 'SOS request not found' });
    req.app.get('io').emit('sos:removed', { id: sos._id });
    res.json({ message: 'SOS request deleted' });
  } catch (err) {
    next(err);
  }
};
