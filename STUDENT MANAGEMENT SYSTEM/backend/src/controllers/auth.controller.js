const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  comparePassword,
  generateToken,
  generateAdmissionNumber,
} = require('../utils/helpers');

const prisma = new PrismaClient();

// ── Register ──────────────────────────────────
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, gender } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: 'STUDENT',
        student: {
          create: {
            admissionNumber: generateAdmissionNumber(),
            firstName,
            lastName,
            phone,
            gender: gender || 'MALE',
          },
        },
      },
    });

    const token = generateToken(user.id, user.role);
    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { token, role: user.role, email: user.email },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// ── Login ─────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    // Fetch profile data based on role
    let profile = null;
    if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({ where: { userId: user.id } });
    } else if (user.role === 'TEACHER') {
      profile = await prisma.teacher.findUnique({ where: { userId: user.id } });
    } else {
      profile = await prisma.student.findUnique({ where: { userId: user.id } });
    }

    const token = generateToken(user.id, user.role);
    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          profile,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// ── Get current user (me) ─────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    });

    let profile = null;
    if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({ where: { userId: user.id } });
    } else if (user.role === 'TEACHER') {
      profile = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { subjects: true },
      });
    } else {
      profile = await prisma.student.findUnique({
        where: { userId: user.id },
        include: { class: true },
      });
    }

    return res.json({ success: true, data: { ...user, profile } });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Change password ───────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('ChangePassword error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { register, login, getMe, changePassword };
