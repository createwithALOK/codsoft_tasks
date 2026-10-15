const express = require('express');
const router = express.Router();
const { getAdminStats, getTeacherStats, getStudentStats } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/admin', authorize('ADMIN'), getAdminStats);
router.get('/teacher', authorize('TEACHER'), getTeacherStats);
router.get('/student', authorize('STUDENT'), getStudentStats);

module.exports = router;
