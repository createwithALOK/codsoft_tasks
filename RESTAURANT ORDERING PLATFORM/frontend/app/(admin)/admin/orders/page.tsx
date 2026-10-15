'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { Order } from '@/types';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/kitchen/StatusBadge';
import { Select } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/components/providers';
import { cn } from '@/lib/utils';

type FilterTab = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const ACTIVE_STATUSES = new Set(['PLACED', 'CONFIRMED', 'PREPARING', 'READY']);
const COMPLETED_STATUSES = new Set(['DELIVERED']);
const CANCELLED_STATUSES = new Set(['CANCELLED']);

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const user = getUser();
    if (user && user.role !== 'ADMIN') { router.push('/'); return; }
    fetchOrders();
  }, [router]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await api.get('/api/orders');
      setOrders(res.data.data ?? res.data ?? []);
    } catch {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as Order['status'] } : o))
      );
      toast('Order status updated', 'success');
    } catch {
      toast('Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'ACTIVE':
        return orders.filter((o) => ACTIVE_STATUSES.has(o.status));
      case 'COMPLETED':
        return orders.filter((o) => COMPLETED_STATUSES.has(o.status));
      case 'CANCELLED':
        return orders.filter((o) => CANCELLED_STATUSES.has(o.status));
      default:
        return orders;
    }
  }, [orders, activeTab]);

  const columns: Column<Order>[] = [
    { key: 'orderNumber', header: 'Order #', render: (o) => `#${o.orderNumber}` },
    {
      key: 'user',
      header: 'Customer',
      render: (o) => o.user?.name ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      render: (o) =>
        o.type === 'DINE_IN' ? 'Dine In' : o.type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery',
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => o.orderItems?.length ?? '—',
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (o) => formatCurrency(o.totalAmount),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (o) => <StatusBadge status={o.paymentStatus} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: 'statusUpdate',
      header: 'Update Status',
      render: (o) => (
        <div className="relative min-w-35">
          <Select
            value={o.status}
            onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
            disabled={updatingId === o.id}
            className="text-xs py-1"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed At',
      render: (o) => formatDate(o.createdAt),
    },
  ];

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text mb-6">Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 border-b border-surface-border">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} />
    </div>
  );
}
