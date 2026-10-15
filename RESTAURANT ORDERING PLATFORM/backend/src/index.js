require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// ─── Controllers that need the io instance ────────────────────────────────
const orderController = require('./controllers/orderController');
const kitchenController = require('./controllers/kitchenController');

// ─── Routes ───────────────────────────────────────────────────────────────
const authRouter = require('./routes/auth');
const menuRouter = require('./routes/menu');
const tablesRouter = require('./routes/tables');
const reservationsRouter = require('./routes/reservations');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const kitchenRouter = require('./routes/kitchen');

const app = express();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }

  process.env.JWT_SECRET = 'dinedesk-dev-secret';
  console.warn('JWT_SECRET is not set — using a development-only fallback.');
}

// ─── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────
// Stripe webhook requires the raw body — mount before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// All other routes get JSON parsing
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'dinedesk-api' });
});

// ─── Mount routers ────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/kitchen', kitchenRouter);

// ─── HTTP server + Socket.io ──────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  // Join a user-specific room so targeted events can be sent
  socket.join(`user:${socket.user.id}`);

  socket.on('disconnect', () => {
    // cleanup handled automatically by Socket.io
  });
});

// ─── Provide io to controllers ───────────────────────────────────────────
orderController.setIo(io);
kitchenController.setIo(io);

// ─── Central error handler ────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`DineDesk API running on port ${PORT}`);
});

// Export io for any other module that may need it
module.exports = { io };
