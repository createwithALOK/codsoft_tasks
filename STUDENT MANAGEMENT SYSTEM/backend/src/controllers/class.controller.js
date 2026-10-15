const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { students: true } },
        teachers: { include: { teacher: { select: { firstName: true, lastName: true } } } },
        subjects: { include: { subject: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: classes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getClassById = async (req, res) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        students: { include: { user: { select: { email: true } } } },
        teachers: { include: { teacher: true } },
        subjects: { include: { subject: true } },
        schedules: { include: { subject: true }, orderBy: { day: 'asc' } },
        exams: { include: { subject: true }, orderBy: { date: 'desc' } },
      },
    });
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    return res.json({ success: true, data: cls });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, section, academicYear, capacity, roomNumber } = req.body;
    const cls = await prisma.class.create({
      data: { name, section, academicYear, capacity: capacity || 40, roomNumber },
    });
    return res.status(201).json({ success: true, message: 'Class created.', data: cls });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Class with this name, section and year already exists.' });
    }
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { name, section, academicYear, capacity, roomNumber } = req.body;
    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data: { name, section, academicYear, capacity, roomNumber },
    });
    return res.json({ success: true, message: 'Class updated.', data: cls });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteClass = async (req, res) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const assignTeacherToClass = async (req, res) => {
  try {
    const { classId, teacherId, isClassTeacher } = req.body;
    const record = await prisma.classTeacher.upsert({
      where: { classId_teacherId: { classId, teacherId } },
      update: { isClassTeacher: isClassTeacher || false },
      create: { classId, teacherId, isClassTeacher: isClassTeacher || false },
    });
    return res.json({ success: true, message: 'Teacher assigned to class.', data: record });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllClasses, getClassById, createClass, updateClass, deleteClass, assignTeacherToClass };
