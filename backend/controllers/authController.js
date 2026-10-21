const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  bloodGroup: u.bloodGroup,
  locality: u.locality,
  city: u.city,
  pincode: u.pincode,
  role: u.role,
  isAvailable: u.isAvailable,
  isVerified: u.isVerified,
  lastDonatedDate: u.lastDonatedDate
});
exports.publicUser = publicUser;

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, bloodGroup, locality, city, pincode } = req.body;
    if (await User.findOne({ email: String(email).toLowerCase() })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, phone, password: hashed, bloodGroup, locality, city, pincode
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => res.json({ user: publicUser(req.user) });
