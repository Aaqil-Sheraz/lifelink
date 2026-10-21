const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/authMiddleware');
const { register, login, me } = require('../controllers/authController');
const { BLOOD_GROUPS } = require('../utils/constants');

router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('phone').isMobilePhone('any'),
    body('password').isLength({ min: 6 }),
    body('bloodGroup').isIn(BLOOD_GROUPS),
    body('locality').trim().notEmpty()
  ],
  validate,
  register
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, login);
router.get('/me', protect, me);

module.exports = router;
