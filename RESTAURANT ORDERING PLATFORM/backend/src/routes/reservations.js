const { Router } = require('express');
const {
  createReservation,
  getReservations,
  updateReservation,
} = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

// POST /api/reservations        — CUSTOMER only
router.post('/', authenticate, requireRole('CUSTOMER'), createReservation);

// GET  /api/reservations        — authenticated (CUSTOMER=own, ADMIN=all)
router.get('/', authenticate, getReservations);

// PUT  /api/reservations/:id    — authenticated (CUSTOMER=cancel own, ADMIN=confirm/cancel)
router.put('/:id', authenticate, updateReservation);

module.exports = router;
