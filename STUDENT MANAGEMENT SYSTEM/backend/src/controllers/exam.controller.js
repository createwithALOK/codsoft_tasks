const { PrismaClient } = require('@prisma/client');
const { calculateGrade, calculateGPA } = require('../utils/helpers');
const prisma = new PrismaClient();

// ── Exams CRUD ────────────────────────────────
const getAllExams = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    const exams = await prisma.exam.findMany({
      where: {
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: true,
        class: { select: { name: true, section: true } },
        _count: { select: { results: true } },
      },
      orderBy: { date: 'desc' },
    });
    return res.json({ success: true, data: exams });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createExam = async (req, res) => {
  try {
    const { title, examType, subjectId, classId, date, startTime, endTime, totalMarks, passingMarks, description } = req.body;

    const exam = await prisma.exam.create({
      data: {
        title, examType, subjectId, classId,
        date: new Date(date),
        startTime, endTime,
        totalMarks: totalMarks || 100,
        passingMarks: passingMarks || 33,
        description,
      },
    });
    return res.status(201).json({ success: true, message: 'Exam created.', data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateExam = async (req, res) => {
  try {
    const { title, examType, subjectId, classId, date, startTime, endTime, totalMarks, passingMarks, description } = req.body;
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        title, examType, subjectId, classId,
        date: date ? new Date(date) : undefined,
        startTime, endTime, totalMarks, passingMarks, description,
      },
    });
    return res.json({ success: true, message: 'Exam updated.', data: exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteExam = async (req, res) => {
  try {
    await prisma.exam.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Exam deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Exam Results ──────────────────────────────
const submitResults = async (req, res) => {
  try {
    const { examId, results } = req.body;
    // results: [{ studentId, marksObtained, isAbsent, remarks }]

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    const upserts = results.map((r) => {
      const percentage = (r.marksObtained / exam.totalMarks) * 100;
      const grade = r.isAbsent ? 'AB' : calculateGrade(percentage);

      return prisma.examResult.upsert({
        where: { examId_studentId: { examId, studentId: r.studentId } },
        update: {
          marksObtained: r.marksObtained || 0,
          grade,
          remarks: r.remarks,
          isAbsent: r.isAbsent || false,
        },
        create: {
          examId,
          studentId: r.studentId,
          marksObtained: r.marksObtained || 0,
          grade,
          remarks: r.remarks,
          isAbsent: r.isAbsent || false,
        },
      });
    });

    const saved = await prisma.$transaction(upserts);
    return res.json({ success: true, message: `Results saved for ${saved.length} students.`, data: saved });
  } catch (error) {
    console.error('SubmitResults error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const results = await prisma.examResult.findMany({
      where: { examId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        exam: { select: { title: true, totalMarks: true, passingMarks: true } },
      },
      orderBy: { marksObtained: 'desc' },
    });
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyResults = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const results = await prisma.examResult.findMany({
      where: { studentId: student.id },
      include: {
        exam: {
          include: {
            subject: { select: { name: true, code: true } },
            class: { select: { name: true, section: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllExams, createExam, updateExam, deleteExam, submitResults, getExamResults, getMyResults };
