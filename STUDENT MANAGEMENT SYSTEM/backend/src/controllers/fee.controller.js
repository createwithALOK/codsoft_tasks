const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Fee Structures ────────────────────────────
const getFeeStructures = async (req, res) => {
  try {
    const structures = await prisma.feeStructure.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: structures });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createFeeStructure = async (req, res) => {
  try {
    const { name, amount, academicYear, dueDate, description } = req.body;
    const structure = await prisma.feeStructure.create({
      data: { name, amount: parseFloat(amount), academicYear, dueDate: new Date(dueDate), description },
    });
    return res.status(201).json({ success: true, message: 'Fee structure created.', data: structure });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Student Fees ──────────────────────────────
const getAllFees = async (req, res) => {
  try {
    const { studentId, status, academicYear } = req.query;
    const fees = await prisma.fee.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(status && { status }),
        ...(academicYear && { feeStructure: { academicYear } }),
      },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
        feeStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: fees });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const assignFeeToStudent = async (req, res) => {
  try {
    const { studentId, feeStructureId } = req.body;
    const fee = await prisma.fee.create({
      data: { studentId, feeStructureId, status: 'UNPAID' },
      include: { feeStructure: true },
    });
    return res.status(201).json({ success: true, message: 'Fee assigned.', data: fee });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMethod, transactionId, remarks } = req.body;

    const existing = await prisma.fee.findUnique({
      where: { id },
      include: { feeStructure: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Fee record not found.' });

    const paid = parseFloat(amountPaid);
    const total = parseFloat(existing.feeStructure.amount);
    const totalPaid = parseFloat(existing.amountPaid) + paid;

    let status = 'PARTIAL';
    if (totalPaid >= total) status = 'PAID';

    const fee = await prisma.fee.update({
      where: { id },
      data: {
        amountPaid: totalPaid,
        status,
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        remarks,
      },
    });

    return res.json({ success: true, message: 'Payment recorded.', data: fee });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Student: my fees ──────────────────────────
const getMyFees = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const fees = await prisma.fee.findMany({
      where: { studentId: student.id },
      include: { feeStructure: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalDue = fees.reduce((acc, f) => acc + parseFloat(f.feeStructure.amount), 0);
    const totalPaid = fees.reduce((acc, f) => acc + parseFloat(f.amountPaid), 0);
    const totalPending = totalDue - totalPaid;

    return res.json({
      success: true,
      data: { fees, summary: { totalDue, totalPaid, totalPending } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Fee stats (admin) ─────────────────────────
const getFeeStats = async (req, res) => {
  try {
    const [total, paid, unpaid, partial] = await Promise.all([
      prisma.fee.count(),
      prisma.fee.count({ where: { status: 'PAID' } }),
      prisma.fee.count({ where: { status: 'UNPAID' } }),
      prisma.fee.count({ where: { status: 'PARTIAL' } }),
    ]);

    const revenue = await prisma.fee.aggregate({ _sum: { amountPaid: true } });

    return res.json({
      success: true,
      data: {
        total, paid, unpaid, partial,
        totalRevenue: revenue._sum.amountPaid || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getFeeStructures, createFeeStructure, getAllFees, assignFeeToStudent, recordPayment, getMyFees, getFeeStats };
