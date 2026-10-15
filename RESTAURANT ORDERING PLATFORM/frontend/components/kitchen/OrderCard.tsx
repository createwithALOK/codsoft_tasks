'use client';

import React, { useEffect, useState } from 'react';
import { Order } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { Clock } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

function timeSince(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

const NEXT_STATUS: Record<string, string | null> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

const ACTION_LABEL: Record<string, string> = {
  PLACED: 'Confirm',
  CONFIRMED: 'Start Preparing',
  PREPARING: 'Mark Ready',
  READY: 'Deliver',
};

export default function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [timeLabel, setTimeLabel] = useState(() => timeSince(order.createdAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(timeSince(order.createdAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const nextStatus = NEXT_STATUS[order.status];
  const actionLabel = ACTION_LABEL[order.status];

  const locationLabel =
    order.type === 'DINE_IN' && order.table
      ? `Table ${order.table.tableNumber}`
      : order.type === 'TAKEAWAY'
      ? 'Takeaway'
      : 'Delivery';

  return (
    <Card className="mb-3">
      <CardHeader className="py-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm text-text">#{order.orderNumber}</span>
          <StatusBadge status={order.status} size="sm" />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-muted font-medium">{locationLabel}</span>
          {order.user && (
            <span className="text-xs text-text-muted">· {order.user.name}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-2 px-3">
        {/* Items list */}
        <ul className="space-y-0.5 mb-3">
          {order.orderItems?.map((item) => (
            <li key={item.id} className="text-xs text-text">
              <span className="font-semibold">{item.quantity}×</span>{' '}
              {item.menuItem?.name ?? `Item #${item.menuItemId}`}
            </li>
          ))}
        </ul>

        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-text-muted mb-3">
          <Clock className="w-3 h-3" />
          <span>{timeLabel}</span>
        </div>

        {/* Action button */}
        {nextStatus && actionLabel && (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={() => onStatusUpdate(order.id, nextStatus)}
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
