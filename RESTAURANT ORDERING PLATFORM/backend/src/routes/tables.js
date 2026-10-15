const { Router } = require('express');
const { getTables, updateTableStatus } = require('../controllers/tableController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

// GET  /api/tables             — all authenticated users
router.get('/', authenticate, getTables);

// PUT  /api/tables/:id/status  — ADMIN only
router.put('/:id/status', authenticate, requireRole('ADMIN'), updateTableStatus);

module.exports = router;
