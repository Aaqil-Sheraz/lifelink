const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getStats, getPendingDonors, verifyDonor, getAllSOS
} = require('../controllers/adminController');

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/donors/pending', getPendingDonors);
router.patch('/donors/:id/verify', verifyDonor);
router.get('/sos', getAllSOS);

module.exports = router;
