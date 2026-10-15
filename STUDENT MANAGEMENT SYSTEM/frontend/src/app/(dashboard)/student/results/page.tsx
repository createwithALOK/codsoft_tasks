'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { gradeColor, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { ExamResult } from '@/types';

const examTypeColors: Record<string, string> = {
  MIDTERM: 'bg-blue-100 text-blue-700',
  FINAL: 'bg-purple-100 text-purple-700',
  QUIZ: 'bg-yellow-100 text-yellow-700',
  ASSIGNMENT: 'bg-green-100 text-green-700',
  PRACTICAL: 'bg-orange-100 text-orange-700',
};

export default function StudentResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exams/my-results').then((res) => setResults(res.data.data)).finally(() => setLoading(false));
  }, []);

  // Aggregate stats
  const attempted = results.filter((r) => !r.isAbsent).length;
  const totalMarks = results.reduce((acc, r) => acc + (r.exam?.totalMarks ?? 0), 0);
  const obtainedMarks = results.filter((r) => !r.isAbsent).reduce((acc, r) => acc + r.marksObtained, 0);
  const overallPct = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : '0.0';

  const columns = [
    { key: 'exam', header: 'Exam', render: (r: ExamResult) => <span className="font-medium text-gray-900">{r.exam?.title}</span> },
    {
      key: 'type',
      header: 'Type',
      render: (r: ExamResult) => r.exam?.examType
        ? <Badge label={r.exam.examType} className={examTypeColors[r.exam.examType] ?? 'bg-gray-100 text-gray-700'} />
        : '—',
    },
    { key: 'subject', header: 'Subject', render: (r: ExamResult) => r.exam?.subject?.name ?? '—' },
    { key: 'date', header: 'Date', render: (r: ExamResult) => formatDate(r.exam?.date) },
    {
      key: 'marks',
      header: 'Marks',
      render: (r: ExamResult) => r.isAbsent
        ? <Badge label="Absent" className="bg-gray-100 text-gray-600" />
        : <span className="font-semibold">{r.marksObtained} / {r.exam?.totalMarks}</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (r: ExamResult) => r.grade ? <Badge label={r.grade} className={gradeColor(r.grade)} /> : '—',
    },
    {
      key: 'result',
      header: 'Result',
      render: (r: ExamResult) => {
        if (r.isAbsent) return <Badge label="Absent" className="bg-gray-100 text-gray-600" />;
        const passed = r.marksObtained >= (r.exam?.passingMarks ?? 33);
        return <Badge label={passed ? 'Pass' : 'Fail'} className={passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} />;
      },
    },
  ];

  return (
    <DashboardLayout pageTitle="My Results" requiredRole="STUDENT">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Exams Attempted', value: attempted, color: 'bg-blue-50 text-blue-700' },
          { label: 'Marks Obtained', value: `${obtainedMarks}/${totalMarks}`, color: 'bg-green-50 text-green-700' },
          { label: 'Overall %', value: `${overallPct}%`, color: 'bg-yellow-50 text-yellow-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Card padding={false}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Exam Results</h3>
        </div>
        <div className="p-5">
          <Table columns={columns} data={results} loading={loading} keyExtractor={(r) => r.id} emptyMessage="No results available yet." />
        </div>
      </Card>
    </DashboardLayout>
  );
}
