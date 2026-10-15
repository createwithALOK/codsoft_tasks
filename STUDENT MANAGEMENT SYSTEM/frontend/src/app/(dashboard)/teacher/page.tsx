'use client';

import { useEffect, useState } from 'react';
import { School, Calendar, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { StatCard, Card } from '@/components/ui/Card';
import { formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Teacher, ClassTeacher, Exam } from '@/types';

interface TeacherDashData {
  teacher: Teacher;
  myClasses: ClassTeacher[];
  upcomingExams: Exam[];
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/teacher').then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, []);

  const totalStudents = data?.myClasses.reduce((acc, ct) => acc + (ct.class?._count?.students ?? 0), 0) ?? 0;

  return (
    <DashboardLayout pageTitle="Teacher Dashboard" requiredRole="TEACHER">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard title="My Classes" value={loading ? '...' : data?.myClasses.length ?? 0} icon={<School className="w-6 h-6" />} color="blue" />
        <StatCard title="Total Students" value={loading ? '...' : totalStudents} icon={<BookOpen className="w-6 h-6" />} color="green" />
        <StatCard title="Upcoming Exams" value={loading ? '...' : data?.upcomingExams.length ?? 0} icon={<Calendar className="w-6 h-6" />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* My Classes */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <School className="w-4 h-4 text-primary-600" /> My Classes
          </h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse mb-3" />)
          ) : data?.myClasses.length === 0 ? (
            <p className="text-sm text-gray-500">No classes assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.myClasses.map((ct) => (
                <div key={ct.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{ct.class?.name} – {ct.class?.section}</p>
                    <p className="text-xs text-gray-500">{ct.class?.academicYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary-600">{ct.class?._count?.students ?? 0}</p>
                    <p className="text-xs text-gray-400">students</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" /> Upcoming Exams
          </h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse mb-3" />)
          ) : data?.upcomingExams.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming exams.</p>
          ) : (
            <div className="space-y-3">
              {data?.upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-500">{exam.subject?.name} • {exam.class?.name} {exam.class?.section}</p>
                  </div>
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                    {formatDate(exam.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
