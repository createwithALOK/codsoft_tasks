const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * POST /api/reservations  (CUSTOMER only)
 * Create a new reservation after checking for conflicts.
 */
async function createReservation(req, res, next) {
  try {
    let { tableId, date, timeSlot, partySize, specialRequests } = req.body;

    if (!date || !timeSlot || !partySize) {
      return res.status(400).json({
        success: false,
        message: 'date, timeSlot, and partySize are required',
      });
    }

    if (!tableId) {
      const candidate = await prisma.table.findFirst({
        where: {
          status: { in: ['AVAILABLE', 'RESERVED'] },
          capacity: { gte: parseInt(partySize, 10) },
        },
        orderBy: { capacity: 'asc' },
      });
      if (!candidate) {
        return res.status(409).json({
          success: false,
          message: 'No tables available for that party size',
        });
      }
      tableId = candidate.id;
    }

    // Check for existing CONFIRMED reservation for same table + date + timeSlot
    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId,
        date: new Date(date),
        timeSlot,
        status: 'CONFIRMED',
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'This table is already reserved for the selected time slot',
      });
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: req.user.id,
        tableId,
        date: new Date(date),
        timeSlot,
        partySize: parseInt(partySize, 10),
        status: 'PENDING',
        specialRequests,
      },
      include: { table: true },
    });

    return res.status(201).json({ success: true, data: reservation });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reservations
 * CUSTOMER sees own reservations; ADMIN sees all.
 */
async function getReservations(req, res, next) {
  try {
    const where = req.user.role === 'CUSTOMER' ? { userId: req.user.id } : {};

    const reservations = await prisma.reservation.findMany({
      where,
      include: { table: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: reservations });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/reservations/:id
 * CUSTOMER can cancel their own reservation.
 * ADMIN can confirm or cancel any reservation.
 */
async function updateReservation(req, res, next) {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (req.user.role === 'CUSTOMER') {
      // Customers may only cancel their own reservations
      if (reservation.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (status !== 'CANCELLED') {
        return res.status(403).json({ success: false, message: 'Customers may only cancel reservations' });
      }
    } else if (req.user.role === 'ADMIN') {
      if (!['CONFIRMED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'ADMIN can set status to CONFIRMED or CANCELLED only' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true, user: { select: { id: true, name: true, email: true } } },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReservation, getReservations, updateReservation };
