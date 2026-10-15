const { PrismaClient } = require('@prisma/client');
const { hashPassword, generateAdmissionNumber, paginate } = require('../utils/helpers');

const prisma = new PrismaClient();

// ── Get all students ──────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const { page, limit, search, classId } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(classId && { classId }),
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: {
          class: { select: { id: true, name: true, section: true } },
          user: { select: { email: true, isActive: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return res.json({
      success: true,
      data: students,
      pagination: { total, page: parseInt(page) || 1, limit: take },
    });
  } catch (error) {
    console.error('GetAllStudents error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get single student ────────────────────────
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        user: { select: { email: true, isActive: true } },
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        fees: { include: { feeStructure: true } },
        grades: { include: { subject: true } },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    console.error('GetStudentById error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Create student ────────────────────────────
const createStudent = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone, gender, dateOfBirth,
      address, parentName, parentPhone, parentEmail, bloodGroup, classId,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await hashPassword(password || 'Student@123');
    const user = await prisma.user.create({
      data: { email, password: hashed, role: 'STUDENT' },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNumber: generateAdmissionNumber(),
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        parentName,
        parentPhone,
        parentEmail,
        bloodGroup,
        classId: classId || null,
      },
      include: { class: true, user: { select: { email: true } } },
    });

    return res.status(201).json({ success: true, message: 'Student created.', data: student });
  } catch (error) {
    console.error('CreateStudent error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Update student ────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName, lastName, phone, gender, dateOfBirth,
      address, parentName, parentPhone, parentEmail, bloodGroup, classId,
    } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        parentName,
        parentPhone,
        parentEmail,
        bloodGroup,
        classId: classId || null,
      },
      include: { class: true },
    });

    return res.json({ success: true, message: 'Student updated.', data: student });
  } catch (error) {
    console.error('UpdateStudent error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Delete student ────────────────────────────
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Cascade deletes via Prisma onDelete: Cascade on the user relation
    await prisma.user.delete({ where: { id: student.userId } });

    return res.json({ success: true, message: 'Student deleted.' });
  } catch (error) {
    console.error('DeleteStudent error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Get student's own profile (STUDENT role) ──
const getMyProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        class: true,
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        fees: { include: { feeStructure: true } },
        grades: { include: { subject: true } },
        examResults: { include: { exam: { include: { subject: true } } } },
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    return res.json({ success: true, data: student });
  } catch (error) {
    console.error('GetMyProfile error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getMyProfile };
