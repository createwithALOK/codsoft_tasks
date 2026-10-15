'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCartStore } from '@/store/cart';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

function CheckoutForm({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setPayError('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/track/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPayError(error.message || 'Payment failed. Please try again.');
      setPaying(false);
    } else {
      clearCart();
      router.push(`/track/${orderId}`);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement />
      {payError && <p className="text-sm text-red-600">{payError}</p>}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={paying || !stripe}
      >
        {paying ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner size="sm" /> Processing…
          </span>
        ) : (
          `Pay ${formatCurrency(total)}`
        )}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const started = useRef(false);
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);

  const [clientSecret, setClientSecret] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');
  const [demoPaying, setDemoPaying] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!isAuthenticated()) {
      router.push('/login?returnUrl=/checkout');
      return;
    }
    if (useCartStore.getState().items.length === 0) {
      router.push('/cart');
      return;
    }

    const config = (() => {
      try {
        const raw = sessionStorage.getItem('dinedesk-order-config');
        return raw ? JSON.parse(raw) : { orderType: 'DINE_IN', tableNumber: '', address: '' };
      } catch {
        return { orderType: 'DINE_IN', tableNumber: '', address: '' };
      }
    })();

    async function initPayment() {
      try {
        const cartItems = useCartStore.getState().items;
        const orderRes = await api.post('/api/orders', {
          type: config.orderType,
          tableNumber: config.tableNumber ? Number(config.tableNumber) : undefined,
          deliveryAddress: config.address || undefined,
          items: cartItems.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            notes: '',
          })),
        });

        const createdOrder = orderRes.data.data ?? orderRes.data;
        setOrderId(createdOrder.id);

        const payRes = await api.post('/api/payments/create-intent', {
          orderId: createdOrder.id,
        });

        const payData = payRes.data.data ?? payRes.data;
        if (payData.demo) {
          setDemoMode(true);
        } else {
          setClientSecret(payData.clientSecret);
        }
      } catch {
        setInitError('Unable to initialise payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    initPayment();
  }, [router]);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  async function handleDemoPay() {
    if (!orderId) return;
    setDemoPaying(true);
    try {
      await api.post('/api/payments/demo-complete', { orderId });
      clearCart();
      router.push(`/track/${orderId}`);
    } catch {
      setInitError('Could not complete the demo payment.');
      setDemoPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{initError}</p>
        <Button variant="outline" onClick={() => router.push('/cart')}>
          Back to Cart
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text">Order Summary</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.menuItem.id} className="flex justify-between text-sm">
                <span className="text-text">
                  {item.quantity}× {item.menuItem.name}
                </span>
                <span className="text-text-muted">
                  {formatCurrency(item.menuItem.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-surface-border pt-3 space-y-1">
              <div className="flex justify-between text-sm text-text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-muted">
                <span>Tax (5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-text pt-1">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text">Payment</h2>
          </CardHeader>
          <CardContent>
            {demoMode ? (
              <div className="space-y-4">
                <p className="text-sm text-text-muted">
                  Stripe keys are not configured, so this local demo will mark the order as paid without a live card charge.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleDemoPay}
                  disabled={demoPaying}
                >
                  {demoPaying ? 'Confirming…' : `Confirm order · ${formatCurrency(total)}`}
                </Button>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm orderId={orderId} total={total} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
