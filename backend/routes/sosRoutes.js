const router = require('express').Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createSOS, getActiveSOS, getMySOS, getSOSById, fulfillSOS, deleteSOS
} = require('../controllers/sosController');
const { BLOOD_GROUPS, URGENCY } = require('../utils/constants');

router.post(
  '/',
  protect,
  [
    body('patientName').trim().notEmpty(),
    body('bloodGroupNeeded').isIn(BLOOD_GROUPS),
    body('unitsNeeded').optional().isInt({ min: 1 }),
    body('hospitalName').trim().notEmpty(),
    body('locality').trim().notEmpty(),
    body('urgency').optional().isIn(URGENCY)
  ],
  validate,
  createSOS
);

// NOTE: static paths must be declared before '/:id'
router.get(
  '/active',
  protect,
  [query('bloodGroup').optional().isIn(BLOOD_GROUPS), query('canDonate').optional().isIn(BLOOD_GROUPS)],
  validate,
  getActiveSOS
);
router.get('/mine', protect, getMySOS);
router.get('/:id', protect, getSOSById);
router.patch('/:id/fulfill', protect, fulfillSOS);
router.delete('/:id', protect, adminOnly, deleteSOS);

module.exports = router;
