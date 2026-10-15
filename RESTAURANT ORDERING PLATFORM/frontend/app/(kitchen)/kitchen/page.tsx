'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Order } from '@/types';
import { isAuthenticated, getUser, getToken } from '@/lib/auth';
import api from '@/lib/api';
import OrderCard from '@/components/kitchen/OrderCard';
import { Spinner } from '@/components/ui/spinner';
import { RefreshCw } from 'lucide-react';

const COLUMNS: { status: Order['status']; label: string }[] = [
  { status: 'PLACED', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'READY', label: 'Ready' },
];

export default function KitchenPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/api/kitchen/orders');
      setOrders(res.data.data ?? res.data ?? []);
      setLastUpdated(new Date());
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    if (user && user.role !== 'KITCHEN' && user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchOrders();

    // Poll every 30 seconds
    const pollInterval = setInterval(fetchOrders, 30000);

    // Socket.io for real-time updates
    const token = getToken();
    const socket: Socket = io(
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
      { auth: { token }, transports: ['websocket'] }
    );

    socket.on(
      'order:statusUpdated',
      (data: { orderId: string; status: string }) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === data.orderId
              ? { ...o, status: data.status as Order['status'] }
              : o
          )
        );
        setLastUpdated(new Date());
      }
    );

    socket.on('order:new', () => {
      fetchOrders();
    });

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [router, fetchOrders]);

  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      await api.put(`/api/kitchen/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o
        )
      );
    } catch {
      // error handled by api interceptor
    }
  }

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Last updated:{' '}
            {lastUpdated.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLUMNS.map(({ status, label }) => {
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <div key={status} className="bg-gray-800 rounded-xl p-3">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm text-gray-200">{label}</h2>
                  <span className="bg-gray-700 text-gray-300 text-xs font-bold rounded-full px-2 py-0.5">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Orders */}
                {columnOrders.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">
                    No orders
                  </p>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
