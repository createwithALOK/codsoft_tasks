const express = require('express');
const router = express.Router();
const { getAllExams, createExam, updateExam, deleteExam, submitResults, getExamResults, getMyResults } = require('../controllers/exam.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/my-results', authorize('STUDENT'), getMyResults);
router.get('/', authorize('ADMIN', 'TEACHER', 'STUDENT'), getAllExams);
router.post('/', authorize('ADMIN', 'TEACHER'), createExam);
router.put('/:id', authorize('ADMIN', 'TEACHER'), updateExam);
router.delete('/:id', authorize('ADMIN'), deleteExam);
router.post('/results', authorize('ADMIN', 'TEACHER'), submitResults);
router.get('/:examId/results', authorize('ADMIN', 'TEACHER'), getExamResults);

module.exports = router;
