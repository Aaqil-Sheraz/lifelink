const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sosRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'SOSRequest' },
    donationDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DonationHistory', donationSchema);
