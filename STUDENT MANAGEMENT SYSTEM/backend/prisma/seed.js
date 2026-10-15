const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo data seeding is disabled in production.');
  }

  console.log('🌱 Seeding database...');

  // Hash passwords
  const adminPass = await bcrypt.hash('Admin@123', 12);
  const teacherPass = await bcrypt.hash('Teacher@123', 12);
  const studentPass = await bcrypt.hash('Student@123', 12);

  // ── Admin ──────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@edumanage.com' },
    update: {},
    create: {
      email: 'admin@edumanage.com',
      password: adminPass,
      role: 'ADMIN',
      admin: {
        create: { firstName: 'Super', lastName: 'Admin', phone: '9999999999' },
      },
    },
  });

  // ── Teachers ───────────────────────────────
  const teacher1User = await prisma.user.upsert({
    where: { email: 'john.smith@edumanage.com' },
    update: {},
    create: {
      email: 'john.smith@edumanage.com',
      password: teacherPass,
      role: 'TEACHER',
      teacher: {
        create: {
          employeeId: 'EMP-1001',
          firstName: 'John',
          lastName: 'Smith',
          phone: '9876543210',
          gender: 'MALE',
          qualification: 'M.Sc Mathematics',
          specialization: 'Mathematics',
          salary: 45000,
        },
      },
    },
    include: { teacher: true },
  });

  const teacher2User = await prisma.user.upsert({
    where: { email: 'sarah.jones@edumanage.com' },
    update: {},
    create: {
      email: 'sarah.jones@edumanage.com',
      password: teacherPass,
      role: 'TEACHER',
      teacher: {
        create: {
          employeeId: 'EMP-1002',
          firstName: 'Sarah',
          lastName: 'Jones',
          phone: '9876543211',
          gender: 'FEMALE',
          qualification: 'M.Sc Physics',
          specialization: 'Physics',
          salary: 45000,
        },
      },
    },
    include: { teacher: true },
  });

  // ── Subjects ───────────────────────────────
  const mathSubject = await prisma.subject.upsert({
    where: { code: 'MATH101' },
    update: {},
    create: { name: 'Mathematics', code: 'MATH101', credits: 4, teacherId: teacher1User.teacher?.id },
  });

  const physicsSubject = await prisma.subject.upsert({
    where: { code: 'PHY101' },
    update: {},
    create: { name: 'Physics', code: 'PHY101', credits: 4, teacherId: teacher2User.teacher?.id },
  });

  const engSubject = await prisma.subject.upsert({
    where: { code: 'ENG101' },
    update: {},
    create: { name: 'English', code: 'ENG101', credits: 3 },
  });

  // ── Classes ────────────────────────────────
  const class10A = await prisma.class.upsert({
    where: { name_section_academicYear: { name: 'Class 10', section: 'A', academicYear: '2026-27' } },
    update: {},
    create: { name: 'Class 10', section: 'A', academicYear: '2026-27', capacity: 40, roomNumber: 'R101' },
  });

  const class10B = await prisma.class.upsert({
    where: { name_section_academicYear: { name: 'Class 10', section: 'B', academicYear: '2026-27' } },
    update: {},
    create: { name: 'Class 10', section: 'B', academicYear: '2026-27', capacity: 40, roomNumber: 'R102' },
  });

  // Assign teacher to class
  await prisma.classTeacher.upsert({
    where: { classId_teacherId: { classId: class10A.id, teacherId: teacher1User.teacher?.id } },
    update: {},
    create: { classId: class10A.id, teacherId: teacher1User.teacher?.id, isClassTeacher: true },
  });

  // ── Students ───────────────────────────────
  const students = [
    { email: 'alice@student.com', firstName: 'Alice', lastName: 'Johnson', admissionNumber: 'ADM-2026-1001', gender: 'FEMALE' },
    { email: 'bob@student.com', firstName: 'Bob', lastName: 'Williams', admissionNumber: 'ADM-2026-1002', gender: 'MALE' },
    { email: 'carol@student.com', firstName: 'Carol', lastName: 'Brown', admissionNumber: 'ADM-2026-1003', gender: 'FEMALE' },
  ];

  for (const s of students) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: studentPass,
        role: 'STUDENT',
        student: {
          create: {
            admissionNumber: s.admissionNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            gender: s.gender,
            classId: class10A.id,
            parentName: `Parent of ${s.firstName}`,
            parentPhone: '9000000000',
          },
        },
      },
    });
  }

  // ── Fee Structure ──────────────────────────
  await prisma.feeStructure.upsert({
    where: { id: 'fee-struct-001' },
    update: {},
    create: {
      id: 'fee-struct-001',
      name: 'Annual Tuition Fee',
      amount: 25000,
      academicYear: '2026-27',
      dueDate: new Date('2026-11-30'),
      description: 'Annual tuition fee for all students',
    },
  });

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('  Admin:   admin@edumanage.com     / Admin@123');
  console.log('  Teacher: john.smith@edumanage.com / Teacher@123');
  console.log('  Student: alice@student.com         / Student@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
