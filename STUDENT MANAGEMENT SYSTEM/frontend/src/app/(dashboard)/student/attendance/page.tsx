'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, StatCard } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { statusColor, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Attendance } from '@/types';

interface Summary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: string;
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance/me').then((res) => {
      setRecords(res.data.data.records);
      setSummary(res.data.data.summary);
    }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'date', header: 'Date', render: (a: Attendance) => formatDate(a.date) },
    { key: 'class', header: 'Class', render: (a: Attendance) => a.class ? `${a.class.name} – ${a.class.section}` : '—' },
    {
      key: 'status',
      header: 'Status',
      render: (a: Attendance) => <Badge label={a.status} className={statusColor(a.status)} />,
    },
    { key: 'remarks', header: 'Remarks', render: (a: Attendance) => <span className="text-gray-500">{a.remarks ?? '—'}</span> },
  ];

  return (
    <DashboardLayout pageTitle="My Attendance" requiredRole="STUDENT">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Days" value={summary?.total ?? 0} icon={<BookOpen className="w-5 h-5" />} color="blue" />
        <StatCard title="Present" value={summary?.present ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatCard title="Absent" value={summary?.absent ?? 0} icon={<XCircle className="w-5 h-5" />} color="red" />
        <StatCard title="Attendance %" value={`${summary?.percentage ?? 0}%`} icon={<Clock className="w-5 h-5" />} color="yellow" />
      </div>

      {/* Progress bar */}
      {summary && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Attendance</span>
            <span className={`text-lg font-bold ${parseFloat(summary.percentage) >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
              {summary.percentage}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${parseFloat(summary.percentage) >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, parseFloat(summary.percentage))}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {parseFloat(summary.percentage) >= 75
              ? '✓ Attendance is satisfactory.'
              : '⚠ Attendance is below the 75% minimum requirement.'}
          </p>
        </Card>
      )}

      <Card padding={false}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Attendance Records</h3>
        </div>
        <div className="p-5">
          <Table columns={columns} data={records} loading={loading} keyExtractor={(a) => a.id} emptyMessage="No attendance records found." />
        </div>
      </Card>
    </DashboardLayout>
  );
}
