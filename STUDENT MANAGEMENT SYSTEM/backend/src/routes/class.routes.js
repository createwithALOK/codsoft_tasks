const express = require('express');
const router = express.Router();
const { getAllClasses, getClassById, createClass, updateClass, deleteClass, assignTeacherToClass } = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('ADMIN', 'TEACHER', 'STUDENT'), getAllClasses);
router.get('/:id', authorize('ADMIN', 'TEACHER'), getClassById);
router.post('/', authorize('ADMIN'), createClass);
router.put('/:id', authorize('ADMIN'), updateClass);
router.delete('/:id', authorize('ADMIN'), deleteClass);
router.post('/assign-teacher', authorize('ADMIN'), assignTeacherToClass);

module.exports = router;
