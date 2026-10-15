const { Router } = require('express');
const {
  getCategories,
  getItems,
  getItemById,
  createCategory,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/menuController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = Router();

// Public routes
router.get('/categories', getCategories);
router.get('/items', getItems);
router.get('/items/:id', getItemById);

// ADMIN-only routes
router.post('/categories', authenticate, requireRole('ADMIN'), createCategory);
router.post('/items', authenticate, requireRole('ADMIN'), createItem);
router.put('/items/:id', authenticate, requireRole('ADMIN'), updateItem);
router.delete('/items/:id', authenticate, requireRole('ADMIN'), deleteItem);

module.exports = router;
