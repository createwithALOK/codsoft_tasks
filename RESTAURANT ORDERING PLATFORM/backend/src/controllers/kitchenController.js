const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// io is set from index.js after the Socket.io server is created
let io = null;

function setIo(ioInstance) {
  io = ioInstance;
}

/**
 * GET /api/kitchen/orders  (KITCHEN | ADMIN)
 * Return active orders that the kitchen needs to action.
 */
async function getKitchenOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY'] },
      },
      include: {
        orderItems: { include: { menuItem: true } },
        user: { select: { id: true, name: true, email: true } },
        table: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/kitchen/orders/:id/status  (KITCHEN | ADMIN)
 * Update order status from the kitchen and broadcast via Socket.io.
 */
async function updateKitchenOrderStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { table: true },
    });

    if (io) {
      io.emit('order:statusUpdated', {
        orderId: order.id,
        status: order.status,
        tableId: order.tableId,
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = { getKitchenOrders, updateKitchenOrderStatus, setIo };
