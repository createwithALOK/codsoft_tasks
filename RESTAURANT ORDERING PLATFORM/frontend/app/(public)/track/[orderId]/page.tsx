'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Order } from '@/types';
import api from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/kitchen/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
] as const;

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'In the Kitchen',
  READY: 'Ready for Pickup',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const ESTIMATED_TIMES: Record<string, string> = {
  PLACED: 'Waiting for confirmation',
  CONFIRMED: 'Preparing soon',
  PREPARING: '15–25 minutes',
  READY: 'Ready! Collect now',
  DELIVERED: 'Enjoy your meal!',
  CANCELLED: '—',
};

export default function TrackOrderPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let socket: Socket | null = null;

    async function fetchOrder() {
      try {
        const res = await api.get(`/api/orders/${orderId}`);
        setOrder(res.data.data ?? res.data);
      } catch {
        setError('Could not load order details.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Socket.io connection for real-time updates
    const token = getToken();
    socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('order:statusUpdated', (data: { orderId: string; status: string }) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: data.status as Order['status'] } : prev));
      }
    });

    return () => {
      socket?.disconnect();
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-text-muted">{error || 'Order not found.'}</p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUSES.indexOf(order.status as (typeof ORDER_STATUSES)[number]);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text mb-1">
          Order #{order.orderNumber}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={order.status} size="md" />
          <span className="text-sm text-text-muted">{formatDate(order.createdAt)}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled ? (
        <div className="mb-8 space-y-4">
          {ORDER_STATUSES.map((status, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={status} className="flex items-start gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex-shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-surface-border flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                        ? 'text-text'
                        : 'text-text-muted'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {ESTIMATED_TIMES[status]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          This order was cancelled.
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white border border-surface-border rounded-xl p-4 mb-6">
        <h2 className="font-semibold text-text mb-3">Items</h2>
        <div className="space-y-2">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text">
                {item.quantity}× {item.menuItem?.name ?? 'Item'}
              </span>
              <span className="text-text-muted">
                {formatCurrency(item.unitPrice * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-surface-border mt-3 pt-3 flex justify-between font-semibold text-text">
          <span>Total</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
