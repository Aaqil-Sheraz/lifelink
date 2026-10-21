const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const {
  getDonors, updateProfile, toggleAvailability, markDonated, getMyDonations
} = require('../controllers/donorController');
const { BLOOD_GROUPS } = require('../utils/constants');

router.get(
  '/',
  protect,
  [query('bloodGroup').optional().isIn(BLOOD_GROUPS), query('compatibleWith').optional().isIn(BLOOD_GROUPS)],
  validate,
  getDonors
);
router.get('/history', protect, getMyDonations);
router.put(
  '/profile',
  protect,
  [
    body('bloodGroup').optional().isIn(BLOOD_GROUPS),
    body('phone').optional().isMobilePhone('any'),
    body('locality').optional().trim().notEmpty()
  ],
  validate,
  updateProfile
);
router.patch('/availability', protect, toggleAvailability);
router.patch('/donated', protect, markDonated);

module.exports = router;
