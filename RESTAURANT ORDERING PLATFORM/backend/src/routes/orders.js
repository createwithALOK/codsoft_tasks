const { Router } = require('express');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

// POST /api/orders              — authenticated
router.post('/', authenticate, createOrder);

// GET  /api/orders              — authenticated (CUSTOMER=own, ADMIN/KITCHEN=all)
router.get('/', authenticate, getOrders);

// GET  /api/orders/:id          — authenticated
router.get('/:id', authenticate, getOrderById);

// PUT  /api/orders/:id/status   — ADMIN | KITCHEN
router.put('/:id/status', authenticate, requireRole('ADMIN', 'KITCHEN'), updateOrderStatus);

module.exports = router;
