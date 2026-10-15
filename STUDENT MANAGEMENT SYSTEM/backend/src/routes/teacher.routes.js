const express = require('express');
const router = express.Router();
const {
  getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, getMyTeacherProfile,
} = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/me', authorize('TEACHER'), getMyTeacherProfile);
router.get('/', authorize('ADMIN'), getAllTeachers);
router.get('/:id', authorize('ADMIN'), getTeacherById);
router.post('/', authorize('ADMIN'), createTeacher);
router.put('/:id', authorize('ADMIN'), updateTeacher);
router.delete('/:id', authorize('ADMIN'), deleteTeacher);

module.exports = router;
