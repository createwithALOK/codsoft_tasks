const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mark attendance for a list of students
const markAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    // records: [{ studentId, status, remarks }]

    const attendanceDate = new Date(date);

    const upserts = records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_classId_date: { studentId: r.studentId, classId, date: attendanceDate } },
        update: { status: r.status, remarks: r.remarks || null, teacherId: req.teacher?.id || null },
        create: {
          studentId: r.studentId,
          classId,
          date: attendanceDate,
          status: r.status,
          remarks: r.remarks || null,
          teacherId: req.teacher?.id || null,
        },
      })
    );

    const results = await prisma.$transaction(upserts);

    return res.json({ success: true, message: `Attendance marked for ${results.length} students.`, data: results });
  } catch (error) {
    console.error('MarkAttendance error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get attendance by class and date
const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.query;

    const attendance = await prisma.attendance.findMany({
      where: {
        classId,
        date: date ? new Date(date) : undefined,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { student: { firstName: 'asc' } },
    });

    return res.json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get student attendance summary
const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const where = {
      studentId,
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    };

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        records,
        summary: { total, present, absent, late, excused, percentage },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get my attendance (student role)
const getMyAttendance = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const records = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: { class: { select: { name: true, section: true } } },
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: { records, summary: { total, present, absent, late, percentage } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { markAttendance, getAttendanceByClassAndDate, getStudentAttendanceSummary, getMyAttendance };
