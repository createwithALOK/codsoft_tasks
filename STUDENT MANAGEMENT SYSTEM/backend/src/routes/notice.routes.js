const express = require('express');
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require('../controllers/notice.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', getNotices);
router.post('/', authorize('ADMIN'), createNotice);
router.delete('/:id', authorize('ADMIN'), deleteNotice);

module.exports = router;
