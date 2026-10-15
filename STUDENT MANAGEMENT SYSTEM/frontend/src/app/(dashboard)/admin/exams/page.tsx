'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Exam, Class, Subject } from '@/types';

interface ExamForm {
  title: string;
  examType: string;
  subjectId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalMarks: string;
  passingMarks: string;
  description: string;
}

const examTypeColors: Record<string, string> = {
  MIDTERM: 'bg-blue-100 text-blue-700',
  FINAL: 'bg-purple-100 text-purple-700',
  QUIZ: 'bg-yellow-100 text-yellow-700',
  ASSIGNMENT: 'bg-green-100 text-green-700',
  PRACTICAL: 'bg-orange-100 text-orange-700',
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ExamForm>();

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
    Promise.all([api.get('/classes'), api.get('/subjects').catch(() => ({ data: { data: [] } }))]).then(([classRes, subRes]) => {
      setClasses(classRes.data.data);
      // subjects endpoint may not exist yet so fallback gracefully
      setSubjects(subRes.data.data ?? []);
    });
  }, [fetchExams]);

  const openAdd = () => { setEditExam(null); reset(); setShowModal(true); };

  const onSubmit = async (data: ExamForm) => {
    try {
      const payload = { ...data, totalMarks: parseInt(data.totalMarks) || 100, passingMarks: parseInt(data.passingMarks) || 33 };
      if (editExam) {
        await api.put(`/exams/${editExam.id}`, payload);
        toast.success('Exam updated.');
      } else {
        await api.post('/exams', payload);
        toast.success('Exam created.');
      }
      setShowModal(false);
      fetchExams();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted.');
      fetchExams();
    } catch { toast.error('Could not delete.'); }
  };

  const columns = [
    { key: 'title', header: 'Exam Title', render: (e: Exam) => <span className="font-medium text-gray-900">{e.title}</span> },
    {
      key: 'examType',
      header: 'Type',
      render: (e: Exam) => <Badge label={e.examType} className={examTypeColors[e.examType] ?? 'bg-gray-100 text-gray-700'} />,
    },
    { key: 'subject', header: 'Subject', render: (e: Exam) => e.subject?.name ?? '—' },
    { key: 'class', header: 'Class', render: (e: Exam) => e.class ? `${e.class.name} – ${e.class.section}` : '—' },
    { key: 'date', header: 'Date', render: (e: Exam) => formatDate(e.date) },
    { key: 'marks', header: 'Marks', render: (e: Exam) => `${e.totalMarks} (Pass: ${e.passingMarks})` },
    { key: 'results', header: 'Results', render: (e: Exam) => <span className="text-gray-500">{e._count?.results ?? 0} submitted</span> },
    {
      key: 'actions',
      header: '',
      render: (e: Exam) => (
        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
      ),
    },
  ];

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name} – ${c.section}` }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));

  return (
    <DashboardLayout pageTitle="Examinations" requiredRole="ADMIN">
      <Card padding={false}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <FileText className="w-4 h-4" />
            <span className="font-semibold">{exams.length} exams</span>
          </div>
          <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4" /> Schedule Exam</Button>
        </div>
        <div className="p-5">
          <Table columns={columns} data={exams} loading={loading} keyExtractor={(e) => e.id} emptyMessage="No exams scheduled." />
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Exam" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Exam Title *" placeholder="e.g. Midterm Mathematics" error={errors.title?.message} {...register('title', { required: 'Required.' })} />
          <div className="form-row">
            <Select label="Exam Type *" options={[
              { value: 'MIDTERM', label: 'Midterm' },
              { value: 'FINAL', label: 'Final' },
              { value: 'QUIZ', label: 'Quiz' },
              { value: 'ASSIGNMENT', label: 'Assignment' },
              { value: 'PRACTICAL', label: 'Practical' },
            ]} placeholder="Select type" {...register('examType', { required: true })} />
            <Input label="Date *" type="date" error={errors.date?.message} {...register('date', { required: 'Required.' })} />
          </div>
          <div className="form-row">
            <Select label="Class *" options={classOptions} placeholder="Select class" {...register('classId', { required: true })} />
            <Select label="Subject *" options={subjectOptions} placeholder="Select subject" {...register('subjectId', { required: true })} />
          </div>
          <div className="form-row">
            <Input label="Total Marks" type="number" placeholder="100" {...register('totalMarks')} />
            <Input label="Passing Marks" type="number" placeholder="33" {...register('passingMarks')} />
          </div>
          <div className="form-row">
            <Input label="Start Time" type="time" {...register('startTime')} />
            <Input label="End Time" type="time" {...register('endTime')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Schedule Exam</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
