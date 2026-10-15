'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatDate, gradeColor } from '@/utils/format';
import api from '@/lib/axios';
import type { Exam, Student, ExamResult } from '@/types';

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [resultMarks, setResultMarks] = useState<Record<string, string>>({});
  const [savingResults, setSavingResults] = useState(false);
  const [viewResults, setViewResults] = useState<ExamResult[] | null>(null);

  useEffect(() => {
    api.get('/exams').then((eRes) => {
      setExams(eRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const openEnterResults = async (exam: Exam) => {
    setShowResults(exam);
    const studRes = await api.get('/students', { params: { classId: exam.classId, limit: 100 } });
    const studs: Student[] = studRes.data.data;
    setStudents(studs);
    // Pre-fill existing results
    const resRes = await api.get(`/exams/${exam.id}/results`);
    const existing = resRes.data.data as ExamResult[];
    const marks: Record<string, string> = {};
    existing.forEach((r) => { marks[r.studentId] = r.marksObtained.toString(); });
    setResultMarks(marks);
  };

  const openViewResults = async (exam: Exam) => {
    const res = await api.get(`/exams/${exam.id}/results`);
    setViewResults(res.data.data);
  };

  const handleSaveResults = async () => {
    if (!showResults) return;
    setSavingResults(true);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        marksObtained: parseFloat(resultMarks[s.id] ?? '0') || 0,
        isAbsent: !resultMarks[s.id],
        remarks: '',
      }));
      await api.post('/exams/results', { examId: showResults.id, results: records });
      toast.success('Results saved!');
      setShowResults(null);
    } catch { toast.error('Error saving results.'); } finally { setSavingResults(false); }
  };

  const examTypeColors: Record<string, string> = {
    MIDTERM: 'bg-blue-100 text-blue-700',
    FINAL: 'bg-purple-100 text-purple-700',
    QUIZ: 'bg-yellow-100 text-yellow-700',
    ASSIGNMENT: 'bg-green-100 text-green-700',
    PRACTICAL: 'bg-orange-100 text-orange-700',
  };

  const columns = [
    { key: 'title', header: 'Exam', render: (e: Exam) => <span className="font-medium text-gray-900">{e.title}</span> },
    { key: 'examType', header: 'Type', render: (e: Exam) => <Badge label={e.examType} className={examTypeColors[e.examType] ?? 'bg-gray-100 text-gray-700'} /> },
    { key: 'subject', header: 'Subject', render: (e: Exam) => e.subject?.name ?? '—' },
    { key: 'class', header: 'Class', render: (e: Exam) => e.class ? `${e.class.name} – ${e.class.section}` : '—' },
    { key: 'date', header: 'Date', render: (e: Exam) => formatDate(e.date) },
    { key: 'marks', header: 'Total', render: (e: Exam) => `${e.totalMarks}` },
    {
      key: 'actions',
      header: 'Actions',
      render: (e: Exam) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => openViewResults(e)}>View Results</Button>
          <Button size="sm" onClick={() => openEnterResults(e)}>Enter Marks</Button>
        </div>
      ),
    },
  ];

  const resultColumns = [
    { key: 'name', header: 'Student', render: (r: ExamResult) => `${r.student?.firstName} ${r.student?.lastName}` },
    { key: 'admNo', header: 'Adm. No', render: (r: ExamResult) => r.student?.admissionNumber ?? '—' },
    { key: 'marks', header: 'Marks', render: (r: ExamResult) => r.isAbsent ? <Badge label="Absent" className="bg-gray-100 text-gray-600" /> : r.marksObtained },
    { key: 'grade', header: 'Grade', render: (r: ExamResult) => r.grade ? <Badge label={r.grade} className={gradeColor(r.grade)} /> : '—' },
  ];

  return (
    <DashboardLayout pageTitle="Exams & Results" requiredRole="TEACHER">
      <Card padding={false}>
        <div className="p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">All Exams</h3>
        </div>
        <div className="p-5">
          <Table columns={columns} data={exams} loading={loading} keyExtractor={(e) => e.id} emptyMessage="No exams found." />
        </div>
      </Card>

      {/* Enter Marks Modal */}
      <Modal isOpen={!!showResults} onClose={() => setShowResults(null)} title={`Enter Marks — ${showResults?.title}`} size="lg">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Total marks: <strong>{showResults?.totalMarks}</strong> | Passing: <strong>{showResults?.passingMarks}</strong></p>
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-gray-500">{s.admissionNumber}</p>
              </div>
              <input
                type="number"
                min="0"
                max={showResults?.totalMarks ?? 100}
                placeholder="Marks"
                value={resultMarks[s.id] ?? ''}
                onChange={(e) => setResultMarks((prev) => ({ ...prev, [s.id]: e.target.value }))}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" onClick={() => setShowResults(null)}>Cancel</Button>
            <Button loading={savingResults} onClick={handleSaveResults}>Save Results</Button>
          </div>
        </div>
      </Modal>

      {/* View Results Modal */}
      <Modal isOpen={!!viewResults} onClose={() => setViewResults(null)} title="Exam Results" size="lg">
        {viewResults && (
          <Table columns={resultColumns} data={viewResults} keyExtractor={(r) => r.id} emptyMessage="No results submitted yet." />
        )}
      </Modal>
    </DashboardLayout>
  );
}
