'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { gradeColor, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Exam, ExamResult } from '@/types';

export default function TeacherGradesPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/exams').then((eRes) => setExams(eRes.data.data));
  }, []);

  useEffect(() => {
    if (!selectedExam) return;
    setLoading(true);
    api.get(`/exams/${selectedExam}/results`)
      .then((res) => setResults(res.data.data))
      .finally(() => setLoading(false));
  }, [selectedExam]);

  const examOptions = exams.map((e) => ({
    value: e.id,
    label: `${e.title} — ${e.class?.name ?? ''} ${e.class?.section ?? ''} (${formatDate(e.date)})`,
  }));

  // Compute stats
  const pass = results.filter((r) => !r.isAbsent && r.marksObtained >= (exams.find(e => e.id === selectedExam)?.passingMarks ?? 33)).length;
  const fail = results.length - pass;
  const avg = results.length > 0
    ? (results.reduce((acc, r) => acc + r.marksObtained, 0) / results.length).toFixed(1)
    : 0;

  const columns = [
    { key: 'rank', header: '#', render: (_: ExamResult, i?: number) => <span className="text-gray-400 font-mono text-xs">{(i ?? 0) + 1}</span> },
    {
      key: 'name',
      header: 'Student',
      render: (r: ExamResult) => (
        <div>
          <p className="font-medium text-gray-900">{r.student?.firstName} {r.student?.lastName}</p>
          <p className="text-xs text-gray-500">{r.student?.admissionNumber}</p>
        </div>
      ),
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (r: ExamResult) => r.isAbsent
        ? <Badge label="Absent" className="bg-gray-100 text-gray-600" />
        : <span className="font-semibold text-gray-900">{r.marksObtained}</span>,
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (r: ExamResult) => r.grade ? <Badge label={r.grade} className={gradeColor(r.grade)} /> : '—',
    },
    {
      key: 'status',
      header: 'Result',
      render: (r: ExamResult) => {
        const exam = exams.find((e) => e.id === selectedExam);
        if (r.isAbsent) return <Badge label="Absent" className="bg-gray-100 text-gray-600" />;
        const passed = r.marksObtained >= (exam?.passingMarks ?? 33);
        return <Badge label={passed ? 'Pass' : 'Fail'} className={passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} />;
      },
    },
    { key: 'remarks', header: 'Remarks', render: (r: ExamResult) => <span className="text-gray-500">{r.remarks ?? '—'}</span> },
  ];

  return (
    <DashboardLayout pageTitle="Grades & Results" requiredRole="TEACHER">
      <Card>
        <div className="mb-6">
          <Select
            label="Select Exam"
            options={examOptions}
            placeholder="Choose an exam to view grades..."
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="max-w-lg"
          />
        </div>

        {selectedExam && results.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: 'Total Students', value: results.length, color: 'bg-blue-50 text-blue-700' },
              { label: 'Passed', value: pass, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Failed', value: fail, color: 'bg-red-50 text-red-700' },
              { label: 'Class Average', value: avg, color: 'bg-yellow-50 text-yellow-700' },
            ].map((stat) => (
              <div key={stat.label} className={`px-5 py-3 rounded-xl ${stat.color}`}>
                <p className="text-xs font-medium opacity-70">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        <Table
          columns={columns}
          data={results}
          loading={loading}
          keyExtractor={(r) => r.id}
          emptyMessage={selectedExam ? 'No results entered for this exam.' : 'Select an exam to view grades.'}
        />
      </Card>
    </DashboardLayout>
  );
}
