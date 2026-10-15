const { Router } = require('express');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = Router();

// POST /api/auth         — register new user
router.post('/', register);

// POST /api/auth/register — alias used by the frontend
router.post('/register', register);

// POST /api/auth/login   — login
router.post('/login', login);

// GET  /api/auth/me      — get current user profile
router.get('/me', authenticate, me);

module.exports = router;
