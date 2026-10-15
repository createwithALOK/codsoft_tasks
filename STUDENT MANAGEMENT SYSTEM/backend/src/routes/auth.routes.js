const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request data.',
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  next();
};

const emailValidation = () => body('email')
  .trim()
  .isEmail()
  .withMessage('Enter a valid email address.')
  .normalizeEmail();

const passwordValidation = () => body('password')
  .isString()
  .withMessage('Password is required.')
  .bail()
  .isLength({ min: 12 })
  .withMessage('Password must be at least 12 characters.')
  .bail()
  .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
  .withMessage('Password must not exceed 72 UTF-8 bytes.');

router.post(
  '/register',
  [
    emailValidation(),
    passwordValidation(),
    body('firstName').trim().isLength({ min: 1, max: 80 }).withMessage('First name is required.'),
    body('lastName').trim().isLength({ min: 1, max: 80 }).withMessage('Last name is required.'),
    body('phone').optional({ values: 'falsy' }).isString().isLength({ max: 32 }),
    body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']),
    validateRequest,
  ],
  register
);
router.post(
  '/login',
  [
    emailValidation(),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required.')
      .bail()
      .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
      .withMessage('Password must not exceed 72 UTF-8 bytes.'),
    validateRequest,
  ],
  login
);
router.get('/me', authenticate, getMe);
router.put(
  '/change-password',
  [
    authenticate,
    body('currentPassword').isString().notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isString()
      .isLength({ min: 12 })
      .withMessage('New password must be at least 12 characters.')
      .bail()
      .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
      .withMessage('New password must not exceed 72 UTF-8 bytes.'),
    validateRequest,
  ],
  changePassword
);

module.exports = router;
