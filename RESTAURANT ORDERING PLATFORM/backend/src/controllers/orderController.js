const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// io is set from index.js after the Socket.io server is created
let io = null;

function setIo(ioInstance) {
  io = ioInstance;
}

/**
 * Generate a short human-readable order number.
 */
function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `DD-${ts}-${rand}`;
}

/**
 * POST /api/orders  (authenticated)
 * Create an order with its items inside a transaction.
 */
async function createOrder(req, res, next) {
  try {
    const { items, type, tableId, tableNumber, deliveryAddress } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required and must not be empty' });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: 'type is required (DINE_IN | TAKEAWAY | DELIVERY)' });
    }
    if (type === 'DELIVERY' && !deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress is required for DELIVERY orders' });
    }

    // Fetch menu items to validate and compute totals
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ success: false, message: 'One or more menu items are unavailable or do not exist' });
    }

    const priceMap = {};
    for (const mi of menuItems) {
      priceMap[mi.id] = parseFloat(mi.price);
    }

    let totalAmount = 0;
    for (const item of items) {
      totalAmount += priceMap[item.menuItemId] * item.quantity;
    }

    let resolvedTableId = tableId || null;
    if (!resolvedTableId && tableNumber) {
      const table = await prisma.table.findUnique({
        where: { tableNumber: Number(tableNumber) },
      });
      if (!table) {
        return res.status(400).json({ success: false, message: 'Table number not found' });
      }
      resolvedTableId = table.id;
    }

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          tableId: resolvedTableId,
          orderNumber: generateOrderNumber(),
          status: 'PLACED',
          type,
          totalAmount,
          paymentStatus: 'PENDING',
          deliveryAddress: deliveryAddress || null,
          orderItems: {
            create: items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: priceMap[item.menuItemId],
              notes: item.notes || null,
            })),
          },
        },
        include: {
          orderItems: { include: { menuItem: true } },
          table: true,
        },
      });

      return newOrder;
    });

    if (io) {
      io.emit('order:new', { orderId: order.id });
    }

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders  (authenticated)
 * CUSTOMER sees own orders; ADMIN/KITCHEN sees all.
 */
async function getOrders(req, res, next) {
  try {
    const where = req.user.role === 'CUSTOMER' ? { userId: req.user.id } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: { include: { menuItem: true } },
        table: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id  (authenticated)
 * CUSTOMER may only view their own order; staff can view any.
 */
async function getOrderById(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: { include: { menuItem: true } },
        table: true,
        user: { select: { id: true, name: true, email: true } },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/orders/:id/status  (ADMIN | KITCHEN)
 * Update an order's status and emit a socket event.
 */
async function updateOrderStatus(req, res, next) {
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

    // Emit real-time event
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

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, setIo };
