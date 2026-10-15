const { PrismaClient } = require('@prisma/client');
const { hashPassword, generateEmployeeId, paginate } = require('../utils/helpers');

const prisma = new PrismaClient();

const getAllTeachers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { email: true, isActive: true } },
          subjects: true,
          classes: { include: { class: { select: { name: true, section: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    return res.json({ success: true, data: teachers, pagination: { total, page: parseInt(page) || 1, limit: take } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getTeacherById = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, isActive: true } },
        subjects: true,
        classes: { include: { class: true } },
      },
    });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    return res.json({ success: true, data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTeacher = async (req, res) => {
  try {
    const {
      email, password, firstName, lastName, phone, gender, dateOfBirth,
      address, qualification, specialization, salary,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const hashed = await hashPassword(password || 'Teacher@123');
    const user = await prisma.user.create({ data: { email, password: hashed, role: 'TEACHER' } });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: generateEmployeeId(),
        firstName, lastName, phone,
        gender: gender || 'MALE',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address, qualification, specialization,
        salary: salary ? parseFloat(salary) : null,
      },
    });

    return res.status(201).json({ success: true, message: 'Teacher created.', data: teacher });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, gender, dateOfBirth, address, qualification, specialization, salary } = req.body;

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        firstName, lastName, phone, gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address, qualification, specialization,
        salary: salary ? parseFloat(salary) : undefined,
      },
    });

    return res.json({ success: true, message: 'Teacher updated.', data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteTeacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    await prisma.user.delete({ where: { id: teacher.userId } });
    return res.json({ success: true, message: 'Teacher deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyTeacherProfile = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
      include: {
        subjects: true,
        classes: { include: { class: true } },
      },
    });
    if (!teacher) return res.status(404).json({ success: false, message: 'Profile not found.' });
    return res.json({ success: true, data: teacher });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, getMyTeacherProfile };
