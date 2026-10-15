'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, School, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { StatCard, Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { AdminStats, Student, Exam } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin').then((res) => {
      setStats(res.data.data.stats);
      setRecentStudents(res.data.data.recentStudents);
      setUpcomingExams(res.data.data.upcomingExams);
    }).finally(() => setLoading(false));
  }, []);

  const feeData = stats ? [
    { name: 'Paid', value: stats.paidFees },
    { name: 'Unpaid', value: stats.unpaidFees },
    { name: 'Other', value: stats.totalFees - stats.paidFees - stats.unpaidFees },
  ] : [];

  const barData = [
    { name: 'Students', count: stats?.totalStudents ?? 0 },
    { name: 'Teachers', count: stats?.totalTeachers ?? 0 },
    { name: 'Classes', count: stats?.totalClasses ?? 0 },
  ];

  return (
    <DashboardLayout pageTitle="Admin Dashboard" requiredRole="ADMIN">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Students"
          value={loading ? '...' : stats?.totalStudents ?? 0}
          icon={<GraduationCap className="w-6 h-6" />}
          color="blue"
          change="Active enrollments"
        />
        <StatCard
          title="Total Teachers"
          value={loading ? '...' : stats?.totalTeachers ?? 0}
          icon={<Users className="w-6 h-6" />}
          color="green"
          change="Teaching staff"
        />
        <StatCard
          title="Classes"
          value={loading ? '...' : stats?.totalClasses ?? 0}
          icon={<School className="w-6 h-6" />}
          color="purple"
          change="Active classes"
        />
        <StatCard
          title="Attendance Rate"
          value={loading ? '...' : `${stats?.attendanceRate ?? 0}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="yellow"
          change="Last 30 days"
        />
      </div>

      {/* Revenue + Fee chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <Card className="xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Enrollment Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Fee Collection</h3>
          <p className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={feeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {feeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-3 flex-wrap mt-2">
            {feeData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent students + upcoming exams */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary-600" /> Recent Admissions
          </h3>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))
            ) : recentStudents.length === 0 ? (
              <p className="text-sm text-gray-500">No students yet.</p>
            ) : (
              recentStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-500">{s.admissionNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{s.class ? `${s.class.name} ${s.class.section}` : 'Unassigned'}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" /> Upcoming Exams
          </h3>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))
            ) : upcomingExams.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming exams.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-500">
                      {exam.subject?.name} • {exam.class?.name} {exam.class?.section}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {formatDate(exam.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
