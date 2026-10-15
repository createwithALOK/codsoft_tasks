const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET === 'replace-with-a-random-64-character-hex-secret' ||
  process.env.JWT_SECRET.toLowerCase().includes('change-me')
) {
  throw new Error('JWT_SECRET must be a unique random secret of at least 32 characters.');
}

const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const classRoutes = require('./routes/class.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const examRoutes = require('./routes/exam.routes');
const feeRoutes = require('./routes/fee.routes');
const noticeRoutes = require('./routes/notice.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Routes ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EduManage API is running', timestamp: new Date() });
});

// ── Global error handler ──────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EduManage API running on http://localhost:${PORT}`);
});

module.exports = app;
