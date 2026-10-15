'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { Order } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/kitchen/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login?returnUrl=/orders');
      return;
    }

    api
      .get('/api/orders')
      .then((res) => {
        setOrders(res.data.data ?? res.data ?? []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-8">My Orders</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <ClipboardList className="w-14 h-14 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium mb-2">No orders yet</p>
          <p className="text-sm mb-6">Place your first order from our menu.</p>
          <Link href="/menu" className="text-primary font-medium hover:underline text-sm">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase">
                  Track
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-surface-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-surface-muted transition-colors">
                  <td className="px-4 py-3 font-medium text-text">
                    #{order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {order.type === 'DINE_IN'
                      ? 'Dine In'
                      : order.type === 'TAKEAWAY'
                      ? 'Takeaway'
                      : 'Delivery'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/track/${order.id}`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
