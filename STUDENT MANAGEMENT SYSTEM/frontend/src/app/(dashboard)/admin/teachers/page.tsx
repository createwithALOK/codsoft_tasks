'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Teacher } from '@/types';

interface TeacherForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  qualification: string;
  specialization: string;
  salary: string;
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TeacherForm>();

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teachers', { params: { search, limit: 50 } });
      setTeachers(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const openAdd = () => { setEditTeacher(null); reset(); setShowModal(true); };
  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setValue('firstName', t.firstName);
    setValue('lastName', t.lastName);
    setValue('phone', t.phone ?? '');
    setValue('gender', t.gender);
    setValue('qualification', t.qualification ?? '');
    setValue('specialization', t.specialization ?? '');
    setValue('salary', t.salary?.toString() ?? '');
    setShowModal(true);
  };

  const onSubmit = async (data: TeacherForm) => {
    try {
      if (editTeacher) {
        await api.put(`/teachers/${editTeacher.id}`, data);
        toast.success('Teacher updated.');
      } else {
        await api.post('/teachers', data);
        toast.success('Teacher created.');
      }
      setShowModal(false);
      fetchTeachers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Teacher deleted.');
      fetchTeachers();
    } catch { toast.error('Could not delete.'); }
  };

  const columns = [
    {
      key: 'name',
      header: 'Teacher',
      render: (t: Teacher) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
            {t.firstName[0]}{t.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{t.firstName} {t.lastName}</p>
            <p className="text-xs text-gray-500">{t.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: 'specialization', header: 'Specialization', render: (t: Teacher) => t.specialization ?? '—' },
    { key: 'qualification', header: 'Qualification', render: (t: Teacher) => t.qualification ?? '—' },
    { key: 'salary', header: 'Salary', render: (t: Teacher) => t.salary ? formatCurrency(t.salary) : '—' },
    { key: 'joiningDate', header: 'Joined', render: (t: Teacher) => formatDate(t.joiningDate) },
    {
      key: 'status',
      header: 'Status',
      render: (t: Teacher) => (
        <Badge label={t.user?.isActive ? 'Active' : 'Inactive'} className={t.user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t: Teacher) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout pageTitle="Teachers" requiredRole="ADMIN">
      <Card padding={false}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4" /> Add Teacher</Button>
        </div>
        <div className="p-5">
          <Table columns={columns} data={teachers} loading={loading} keyExtractor={(t) => t.id} emptyMessage="No teachers found." />
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTeacher ? 'Edit Teacher' : 'Add Teacher'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editTeacher && (
            <div className="form-row">
              <Input label="Email *" type="email" error={errors.email?.message} {...register('email', { required: 'Required.' })} />
              <Input label="Password" type="password" placeholder="Default: Teacher@123" {...register('password')} />
            </div>
          )}
          <div className="form-row">
            <Input label="First Name *" error={errors.firstName?.message} {...register('firstName', { required: 'Required.' })} />
            <Input label="Last Name *" error={errors.lastName?.message} {...register('lastName', { required: 'Required.' })} />
          </div>
          <div className="form-row">
            <Input label="Phone" {...register('phone')} />
            <Select label="Gender" options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]} {...register('gender')} />
          </div>
          <div className="form-row">
            <Input label="Qualification" placeholder="e.g. M.Sc Mathematics" {...register('qualification')} />
            <Input label="Specialization" placeholder="e.g. Mathematics" {...register('specialization')} />
          </div>
          <Input label="Salary (₹)" type="number" {...register('salary')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editTeacher ? 'Update' : 'Create Teacher'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
