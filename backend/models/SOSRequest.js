const mongoose = require('mongoose');
const { BLOOD_GROUPS, URGENCY } = require('../utils/constants');

const sosSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedBy: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relation: String
    },
    patientName: { type: String, required: true, trim: true },
    bloodGroupNeeded: { type: String, enum: BLOOD_GROUPS, required: true },
    unitsNeeded: { type: Number, min: 1, default: 1 },
    hospitalName: { type: String, required: true, trim: true },
    hospitalAddress: String,
    locality: { type: String, required: true, trim: true },
    urgency: { type: String, enum: URGENCY, default: 'critical' },
    status: { type: String, enum: ['active', 'fulfilled', 'expired'], default: 'active' },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

sosSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('SOSRequest', sosSchema);
