const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Hash a plain-text password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain vs hashed password
 */
const comparePassword = async (plain, hashed) => {
  return bcrypt.compare(plain, hashed);
};

/**
 * Generate a signed JWT
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Calculate letter grade from percentage
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

/**
 * Calculate GPA (4.0 scale)
 */
const calculateGPA = (percentage) => {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 70) return 3.3;
  if (percentage >= 60) return 3.0;
  if (percentage >= 50) return 2.0;
  if (percentage >= 40) return 1.0;
  return 0.0;
};

/**
 * Generate a unique admission number: ADM-YYYY-XXXX
 */
const generateAdmissionNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${year}-${random}`;
};

/**
 * Generate a unique employee ID: EMP-XXXX
 */
const generateEmployeeId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${random}`;
};

/**
 * Paginate helper
 */
const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  calculateGrade,
  calculateGPA,
  generateAdmissionNumber,
  generateEmployeeId,
  paginate,
};
