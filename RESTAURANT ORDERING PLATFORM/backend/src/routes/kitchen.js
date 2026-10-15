const { Router } = require('express');
const { getKitchenOrders, updateKitchenOrderStatus } = require('../controllers/kitchenController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

// GET /api/kitchen/orders              — KITCHEN | ADMIN
router.get('/orders', authenticate, requireRole('KITCHEN', 'ADMIN'), getKitchenOrders);

// PUT /api/kitchen/orders/:id/status   — KITCHEN | ADMIN
router.put('/orders/:id/status', authenticate, requireRole('KITCHEN', 'ADMIN'), updateKitchenOrderStatus);

module.exports = router;
