const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Admin Dashboard Stats
const getAdminStats = async (req, res) => {
  try {
    const [
      totalStudents, totalTeachers, totalClasses,
      totalFees, paidFees, unpaidFees,
      recentStudents, upcomingExams,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.fee.count(),
      prisma.fee.count({ where: { status: 'PAID' } }),
      prisma.fee.count({ where: { status: 'UNPAID' } }),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { class: { select: { name: true, section: true } } },
      }),
      prisma.exam.findMany({
        where: { date: { gte: new Date() } },
        take: 5,
        orderBy: { date: 'asc' },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      }),
    ]);

    const revenue = await prisma.fee.aggregate({ _sum: { amountPaid: true } });

    // Attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalAttendance, presentAttendance] = await Promise.all([
      prisma.attendance.count({ where: { date: { gte: thirtyDaysAgo } } }),
      prisma.attendance.count({ where: { date: { gte: thirtyDaysAgo }, status: { in: ['PRESENT', 'LATE'] } } }),
    ]);

    const attendanceRate = totalAttendance > 0
      ? ((presentAttendance / totalAttendance) * 100).toFixed(1)
      : 0;

    return res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalFees,
          paidFees,
          unpaidFees,
          totalRevenue: revenue._sum.amountPaid || 0,
          attendanceRate,
        },
        recentStudents,
        upcomingExams,
      },
    });
  } catch (error) {
    console.error('AdminStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Teacher Dashboard
const getTeacherStats = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    const myClasses = await prisma.classTeacher.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: { _count: { select: { students: true } } },
        },
      },
    });

    const classIds = myClasses.map((c) => c.classId);

    const [upcomingExams, recentAttendance] = await Promise.all([
      prisma.exam.findMany({
        where: { classId: { in: classIds }, date: { gte: new Date() } },
        take: 5,
        orderBy: { date: 'asc' },
        include: { subject: true, class: { select: { name: true, section: true } } },
      }),
      prisma.attendance.findMany({
        where: { classId: { in: classIds } },
        take: 10,
        orderBy: { date: 'desc' },
        distinct: ['date', 'classId'],
      }),
    ]);

    return res.json({
      success: true,
      data: { teacher, myClasses, upcomingExams, recentAttendance },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Student Dashboard
const getStudentStats = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { class: true },
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [attendance, recentResults, pendingFees, notices] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId: student.id, date: { gte: thirtyDaysAgo } },
      }),
      prisma.examResult.findMany({
        where: { studentId: student.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { exam: { include: { subject: true } } },
      }),
      prisma.fee.findMany({
        where: { studentId: student.id, status: { in: ['UNPAID', 'PARTIAL'] } },
        include: { feeStructure: true },
      }),
      prisma.notice.findMany({
        where: {
          OR: [{ targetRole: null }, { targetRole: 'STUDENT' }],
        },
        take: 5,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    const totalAtt = attendance.length;
    const presentAtt = attendance.filter((a) => ['PRESENT', 'LATE'].includes(a.status)).length;
    const attendanceRate = totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : 0;

    return res.json({
      success: true,
      data: {
        student,
        attendanceSummary: { total: totalAtt, present: presentAtt, rate: attendanceRate },
        recentResults,
        pendingFees,
        notices,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAdminStats, getTeacherStats, getStudentStats };
