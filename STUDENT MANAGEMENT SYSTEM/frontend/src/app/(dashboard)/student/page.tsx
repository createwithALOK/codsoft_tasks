'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, FileText, CreditCard, Bell } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { StatCard, Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { gradeColor, formatCurrency, statusColor, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Student, ExamResult, Fee, Notice } from '@/types';

interface StudentDashData {
  student: Student;
  attendanceSummary: { total: number; present: number; rate: string };
  recentResults: ExamResult[];
  pendingFees: Fee[];
  notices: Notice[];
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student').then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout pageTitle="Student Dashboard" requiredRole="STUDENT">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          title="Attendance Rate"
          value={loading ? '...' : `${data?.attendanceSummary.rate ?? 0}%`}
          icon={<ClipboardCheck className="w-6 h-6" />}
          color="green"
          change={`${data?.attendanceSummary.present ?? 0} / ${data?.attendanceSummary.total ?? 0} days`}
        />
        <StatCard
          title="Exams Taken"
          value={loading ? '...' : data?.recentResults.length ?? 0}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          change="Recent results"
        />
        <StatCard
          title="Pending Fees"
          value={loading ? '...' : data?.pendingFees.length ?? 0}
          icon={<CreditCard className="w-6 h-6" />}
          color="red"
          change="Requires payment"
        />
      </div>

      {/* Student info card */}
      {data?.student && (
        <Card className="mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {data.student.firstName[0]}{data.student.lastName[0]}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{data.student.firstName} {data.student.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission No.</p>
                <p className="font-semibold text-gray-900">{data.student.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class</p>
                <p className="font-semibold text-gray-900">{data.student.class ? `${data.student.class.name} – ${data.student.class.section}` : 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gender</p>
                <p className="font-semibold text-gray-900">{data.student.gender}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Results */}
        <Card className="xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" /> Recent Exam Results
          </h3>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse mb-2" />)
          ) : data?.recentResults.length === 0 ? (
            <p className="text-sm text-gray-500">No results yet.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.exam?.title}</p>
                    <p className="text-xs text-gray-500">{r.exam?.subject?.name} • {formatDate(r.exam?.date)}</p>
                  </div>
                  <div className="text-right">
                    {r.isAbsent ? (
                      <Badge label="Absent" className="bg-gray-100 text-gray-600" />
                    ) : (
                      <>
                        <p className="text-sm font-bold text-gray-900">{r.marksObtained}/{r.exam?.totalMarks}</p>
                        {r.grade && <Badge label={r.grade} className={gradeColor(r.grade)} />}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notices + Pending Fees */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-600" /> Notices
            </h3>
            {data?.notices.length === 0 ? (
              <p className="text-sm text-gray-500">No notices.</p>
            ) : (
              <div className="space-y-3">
                {data?.notices.map((n) => (
                  <div key={n.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-900">{n.title}</p>
                    <p className="text-xs text-blue-700 mt-0.5 line-clamp-2">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-500" /> Pending Fees
            </h3>
            {data?.pendingFees.length === 0 ? (
              <p className="text-sm text-emerald-600 font-medium">✓ All fees paid!</p>
            ) : (
              <div className="space-y-2">
                {data?.pendingFees.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.feeStructure?.name}</p>
                      <p className="text-xs text-gray-500">{f.feeStructure?.academicYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{formatCurrency(parseFloat(String(f.feeStructure?.amount ?? 0)) - parseFloat(String(f.amountPaid ?? 0)))}</p>
                      <Badge label={f.status} className={statusColor(f.status)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
