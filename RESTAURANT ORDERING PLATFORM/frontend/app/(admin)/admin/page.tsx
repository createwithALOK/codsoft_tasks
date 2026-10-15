'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { Order, Table, Reservation } from '@/types';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/kitchen/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  IndianRupee,
  Table2,
  CalendarDays,
  UtensilsCrossed,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    if (user && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    Promise.all([
      api.get('/api/orders'),
      api.get('/api/tables'),
      api.get('/api/reservations'),
    ])
      .then(([ordersRes, tablesRes, resRes]) => {
        setOrders(ordersRes.data.data ?? ordersRes.data ?? []);
        setTables(tablesRes.data.data ?? tablesRes.data ?? []);
        setReservations(resRes.data.data ?? resRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  // Today's stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const todayRevenue = todayOrders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const activeTables = tables.filter((t) => t.status !== 'AVAILABLE').length;
  const pendingReservations = reservations.filter(
    (r) => r.status === 'PENDING'
  ).length;

  const recentOrders = orders.slice(0, 10);

  const columns: Column<Order>[] = [
    { key: 'orderNumber', header: 'Order #', render: (o) => `#${o.orderNumber}` },
    { key: 'createdAt', header: 'Date', render: (o) => formatDate(o.createdAt) },
    {
      key: 'type',
      header: 'Type',
      render: (o) =>
        o.type === 'DINE_IN' ? 'Dine In' : o.type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery',
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} size="sm" />,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (o) => formatCurrency(o.totalAmount),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Today's Orders"
          value={todayOrders.length}
          icon={ShoppingBag}
          color="text-blue-600"
        />
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(todayRevenue)}
          icon={IndianRupee}
          color="text-green-600"
        />
        <StatsCard
          title="Active Tables"
          value={activeTables}
          icon={Table2}
          color="text-orange-600"
        />
        <StatsCard
          title="Pending Reservations"
          value={pendingReservations}
          icon={CalendarDays}
          color="text-purple-600"
        />
      </div>

      {/* Recent Orders */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-text mb-4">Recent Orders</h2>
        <DataTable columns={columns} data={recentOrders} loading={loading} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/menu">
            <Button variant="outline" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Manage Menu
            </Button>
          </Link>
          <Link href="/admin/tables">
            <Button variant="outline" className="flex items-center gap-2">
              <Table2 className="w-4 h-4" />
              Manage Tables
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="outline" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              View All Orders
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
