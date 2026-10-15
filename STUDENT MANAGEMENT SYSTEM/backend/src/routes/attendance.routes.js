const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByClassAndDate, getStudentAttendanceSummary, getMyAttendance } = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/mark', authorize('ADMIN', 'TEACHER'), markAttendance);
router.get('/', authorize('ADMIN', 'TEACHER'), getAttendanceByClassAndDate);
router.get('/me', authorize('STUDENT'), getMyAttendance);
router.get('/student/:studentId', authorize('ADMIN', 'TEACHER'), getStudentAttendanceSummary);

module.exports = router;
