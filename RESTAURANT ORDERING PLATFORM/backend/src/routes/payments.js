const { Router } = require('express');
const {
  createPaymentIntent,
  completeDemoPayment,
  handleWebhook,
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// POST /api/payments/create-intent  — authenticated CUSTOMER
router.post('/create-intent', authenticate, createPaymentIntent);

// POST /api/payments/demo-complete — local demo when Stripe is not configured
router.post('/demo-complete', authenticate, completeDemoPayment);

// POST /api/payments/webhook        — raw body; no JSON parser (configured in index.js)
router.post('/webhook', handleWebhook);

module.exports = router;
