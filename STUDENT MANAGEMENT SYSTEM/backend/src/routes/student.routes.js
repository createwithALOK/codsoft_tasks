const express = require('express');
const router = express.Router();
const {
  getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getMyProfile,
} = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/me', authorize('STUDENT'), getMyProfile);
router.get('/', authorize('ADMIN', 'TEACHER'), getAllStudents);
router.get('/:id', authorize('ADMIN', 'TEACHER'), getStudentById);
router.post('/', authorize('ADMIN'), createStudent);
router.put('/:id', authorize('ADMIN'), updateStudent);
router.delete('/:id', authorize('ADMIN'), deleteStudent);

module.exports = router;
