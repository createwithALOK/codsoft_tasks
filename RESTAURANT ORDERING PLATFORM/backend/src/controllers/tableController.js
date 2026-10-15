const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/tables
 * Return all tables (authenticated users).
 */
async function getTables(req, res, next) {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
    });
    return res.status(200).json({ success: true, data: tables });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tables/:id/status  (ADMIN only)
 * Update the status of a specific table.
 */
async function updateTableStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { status },
    });

    return res.status(200).json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTables, updateTableStatus };
