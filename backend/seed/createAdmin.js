require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  if (await User.findOne({ email })) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  await User.create({
    name: 'Admin',
    email,
    phone: process.env.ADMIN_PHONE || '9999999999',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10),
    bloodGroup: 'O+',
    locality: 'HQ',
    role: 'admin',
    isVerified: true,
    isAvailable: false
  });
  console.log('Admin created:', email);
  process.exit(0);
})();
