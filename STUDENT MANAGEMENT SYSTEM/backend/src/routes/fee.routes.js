const express = require('express');
const router = express.Router();
const { getFeeStructures, createFeeStructure, getAllFees, assignFeeToStudent, recordPayment, getMyFees, getFeeStats } = require('../controllers/fee.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/my-fees', authorize('STUDENT'), getMyFees);
router.get('/stats', authorize('ADMIN'), getFeeStats);
router.get('/structures', authorize('ADMIN', 'STUDENT'), getFeeStructures);
router.post('/structures', authorize('ADMIN'), createFeeStructure);
router.get('/', authorize('ADMIN'), getAllFees);
router.post('/assign', authorize('ADMIN'), assignFeeToStudent);
router.put('/:id/pay', authorize('ADMIN'), recordPayment);

module.exports = router;
