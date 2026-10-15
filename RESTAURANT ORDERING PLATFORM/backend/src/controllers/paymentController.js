const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const Stripe = require('stripe');
  return Stripe(process.env.STRIPE_SECRET_KEY);
}

/**
 * POST /api/payments/create-intent  (authenticated CUSTOMER)
 * Create a Stripe PaymentIntent for the given orderId.
 * When Stripe is not configured, returns { demo: true } so local demos still work.
 */
async function createPaymentIntent(req, res, next) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(200).json({
        success: true,
        demo: true,
        clientSecret: null,
        message: 'Stripe is not configured. Use demo checkout to complete the order.',
      });
    }

    const amountInCents = Math.round(parseFloat(order.totalAmount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { orderId: order.id },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/demo-complete  (authenticated CUSTOMER)
 * Marks an order as paid when Stripe keys are not present (local/internship demo).
 */
async function completeDemoPayment(req, res, next) {
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Demo payment is disabled when Stripe is configured',
      });
    }

    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'PAID' },
    });

    await prisma.payment.upsert({
      where: { stripePaymentIntentId: `demo_${orderId}` },
      create: {
        orderId,
        stripePaymentIntentId: `demo_${orderId}`,
        amount: order.totalAmount,
        currency: 'inr',
        status: 'succeeded',
      },
      update: { status: 'succeeded' },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/webhook  (Stripe raw body)
 * Handle incoming Stripe webhook events.
 */
async function handleWebhook(req, res, next) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: `Webhook signature verification failed: ${err.message}`,
    });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { orderId } = paymentIntent.metadata;

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'PAID' },
      });

      await prisma.payment.upsert({
        where: { stripePaymentIntentId: paymentIntent.id },
        create: {
          orderId,
          stripePaymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
        update: {
          status: paymentIntent.status,
        },
      });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createPaymentIntent, completeDemoPayment, handleWebhook };
