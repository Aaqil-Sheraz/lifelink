const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, minlength: 6, select: false },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
    locality: { type: String, required: true, trim: true },
    city: String,
    pincode: String,
    isAvailable: { type: Boolean, default: true },
    lastDonatedDate: Date,
    role: { type: String, enum: ['donor', 'admin'], default: 'donor' },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// fast matching of donors by blood group, locality and availability
userSchema.index({ bloodGroup: 1, locality: 1, isAvailable: 1 });

module.exports = mongoose.model('User', userSchema);
