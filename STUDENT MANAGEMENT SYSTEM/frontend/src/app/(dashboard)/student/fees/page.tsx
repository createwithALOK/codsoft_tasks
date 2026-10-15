'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, StatCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate, statusColor } from '@/utils/format';
import api from '@/lib/axios';
import type { Fee } from '@/types';

interface FeeSummary {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
}

export default function StudentFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fees/my-fees').then((res) => {
      setFees(res.data.data.fees);
      setSummary(res.data.data.summary);
    }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'name', header: 'Fee Name', render: (f: Fee) => <span className="font-medium text-gray-900">{f.feeStructure?.name}</span> },
    { key: 'year', header: 'Year', render: (f: Fee) => f.feeStructure?.academicYear ?? '—' },
    { key: 'amount', header: 'Total Amount', render: (f: Fee) => formatCurrency(f.feeStructure?.amount ?? 0) },
    { key: 'paid', header: 'Amount Paid', render: (f: Fee) => <span className="text-emerald-700 font-medium">{formatCurrency(f.amountPaid)}</span> },
    {
      key: 'pending',
      header: 'Pending',
      render: (f: Fee) => {
        const pending = parseFloat(String(f.feeStructure?.amount ?? 0)) - parseFloat(String(f.amountPaid ?? 0));
        return pending > 0 ? <span className="text-red-600 font-medium">{formatCurrency(pending)}</span> : <span className="text-emerald-600">—</span>;
      },
    },
    { key: 'dueDate', header: 'Due Date', render: (f: Fee) => formatDate(f.feeStructure?.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (f: Fee) => <Badge label={f.status} className={statusColor(f.status)} />,
    },
    { key: 'paymentDate', header: 'Paid On', render: (f: Fee) => formatDate(f.paymentDate) },
    { key: 'method', header: 'Method', render: (f: Fee) => <span className="text-gray-500">{f.paymentMethod ?? '—'}</span> },
  ];

  return (
    <DashboardLayout pageTitle="My Fees" requiredRole="STUDENT">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard title="Total Fee Due" value={formatCurrency(summary?.totalDue ?? 0)} icon={<DollarSign className="w-5 h-5" />} color="blue" />
        <StatCard title="Amount Paid" value={formatCurrency(summary?.totalPaid ?? 0)} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatCard title="Pending Amount" value={formatCurrency(summary?.totalPending ?? 0)} icon={<Clock className="w-5 h-5" />} color="red" />
      </div>

      {/* Payment progress */}
      {summary && summary.totalDue > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fee Payment Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {((summary.totalPaid / summary.totalDue) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (summary.totalPaid / summary.totalDue) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Paid: {formatCurrency(summary.totalPaid)}</span>
            <span>Total: {formatCurrency(summary.totalDue)}</span>
          </div>
        </Card>
      )}

      <Card padding={false}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Fee Details</h3>
        </div>
        <div className="p-5">
          <Table columns={columns} data={fees} loading={loading} keyExtractor={(f) => f.id} emptyMessage="No fee records assigned." />
        </div>
      </Card>
    </DashboardLayout>
  );
}
