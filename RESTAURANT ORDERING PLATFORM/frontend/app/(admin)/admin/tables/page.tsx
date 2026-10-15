'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { Table } from '@/types';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { toast } from '@/components/providers';

type TableStatus = Table['status'];

const statusColors: Record<TableStatus, string> = {
  AVAILABLE: 'bg-green-50 border-green-200',
  OCCUPIED: 'bg-red-50 border-red-200',
  RESERVED: 'bg-yellow-50 border-yellow-200',
};

const statusBadgeColors: Record<TableStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  OCCUPIED: 'bg-red-100 text-red-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
};

export default function AdminTablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const user = getUser();
    if (user && user.role !== 'ADMIN') { router.push('/'); return; }
    fetchTables();
  }, [router]);

  async function fetchTables() {
    setLoading(true);
    try {
      const res = await api.get('/api/tables');
      setTables(res.data.data ?? res.data ?? []);
    } catch {
      toast('Failed to load tables', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(tableId: string, status: TableStatus) {
    setUpdating(tableId);
    try {
      await api.put(`/api/tables/${tableId}/status`, { status });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status } : t))
      );
      toast('Table status updated', 'success');
    } catch {
      toast('Failed to update table status', 'error');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text mb-8">Table Management</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : tables.length === 0 ? (
        <p className="text-center text-text-muted py-16">No tables found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={cn(
                'rounded-xl border-2 p-4 transition-colors',
                statusColors[table.status]
              )}
            >
              {/* Table number */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-text">
                  Table {table.tableNumber}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    statusBadgeColors[table.status]
                  )}
                >
                  {table.status}
                </span>
              </div>

              {/* Details */}
              <div className="text-sm text-text-muted space-y-0.5 mb-3">
                <p>Capacity: {table.capacity}</p>
                {table.location && <p>Location: {table.location}</p>}
              </div>

              {/* Status dropdown */}
              <div className="relative">
                {updating === table.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
                    <Spinner size="sm" />
                  </div>
                )}
                <Select
                  value={table.status}
                  onChange={(e) =>
                    handleStatusChange(table.id, e.target.value as TableStatus)
                  }
                  disabled={updating === table.id}
                  aria-label={`Change status of table ${table.tableNumber}`}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
