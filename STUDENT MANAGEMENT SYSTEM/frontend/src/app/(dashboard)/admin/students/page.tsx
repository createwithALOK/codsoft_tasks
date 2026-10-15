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
import { formatDate } from '@/utils/format';
import api from '@/lib/axios';
import type { Student, Class } from '@/types';

interface StudentForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  parentName: string;
  parentPhone: string;
  bloodGroup: string;
  classId: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<StudentForm>();

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', { params: { search, limit: 50 } });
      setStudents(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    api.get('/classes').then((res) => setClasses(res.data.data));
  }, []);

  const openAdd = () => { setEditStudent(null); reset(); setShowModal(true); };
  const openEdit = (s: Student) => {
    setEditStudent(s);
    setValue('firstName', s.firstName);
    setValue('lastName', s.lastName);
    setValue('phone', s.phone ?? '');
    setValue('gender', s.gender);
    setValue('address', s.address ?? '');
    setValue('parentName', s.parentName ?? '');
    setValue('parentPhone', s.parentPhone ?? '');
    setValue('bloodGroup', s.bloodGroup ?? '');
    setValue('classId', s.classId ?? '');
    setShowModal(true);
  };

  const onSubmit = async (data: StudentForm) => {
    try {
      if (editStudent) {
        await api.put(`/students/${editStudent.id}`, data);
        toast.success('Student updated.');
      } else {
        await api.post('/students', data);
        toast.success('Student created.');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error saving student.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this student permanently?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted.');
      fetchStudents();
    } catch {
      toast.error('Could not delete student.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {s.firstName[0]}{s.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
            <p className="text-xs text-gray-500">{s.admissionNumber}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class',
      render: (s: Student) => s.class ? `${s.class.name} – ${s.class.section}` : '—',
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (s: Student) => <Badge label={s.gender} className="bg-gray-100 text-gray-700" />,
    },
    {
      key: 'email',
      header: 'Email',
      render: (s: Student) => <span className="text-gray-600">{s.user?.email ?? '—'}</span>,
    },
    {
      key: 'admissionDate',
      header: 'Admitted',
      render: (s: Student) => formatDate(s.admissionDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: Student) => (
        <Badge
          label={s.user?.isActive ? 'Active' : 'Inactive'}
          className={s.user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s: Student) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name} – ${c.section}` }));

  return (
    <DashboardLayout pageTitle="Students" requiredRole="ADMIN">
      <Card padding={false}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-200">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="w-4 h-4" /> Add Student
          </Button>
        </div>

        {/* Table */}
        <div className="p-5">
          <Table
            columns={columns}
            data={students}
            loading={loading}
            keyExtractor={(s) => s.id}
            emptyMessage="No students found. Add one to get started."
          />
        </div>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editStudent && (
            <div className="form-row">
              <Input label="Email *" type="email" error={errors.email?.message} {...register('email', { required: 'Email is required.' })} />
              <Input label="Password" type="password" placeholder="Default: Student@123" {...register('password')} />
            </div>
          )}
          <div className="form-row">
            <Input label="First Name *" error={errors.firstName?.message} {...register('firstName', { required: 'Required.' })} />
            <Input label="Last Name *" error={errors.lastName?.message} {...register('lastName', { required: 'Required.' })} />
          </div>
          <div className="form-row">
            <Input label="Phone" type="tel" {...register('phone')} />
            <Select
              label="Gender *"
              options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]}
              placeholder="Select gender"
              {...register('gender')}
            />
          </div>
          <div className="form-row">
            <Input label="Date of Birth" type="date" {...register('dateOfBirth')} />
            <Select label="Assign Class" options={classOptions} placeholder="Select class" {...register('classId')} />
          </div>
          <div className="form-row">
            <Input label="Parent Name" {...register('parentName')} />
            <Input label="Parent Phone" type="tel" {...register('parentPhone')} />
          </div>
          <div className="form-row">
            <Input label="Blood Group" placeholder="e.g. A+" {...register('bloodGroup')} />
            <Input label="Address" {...register('address')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editStudent ? 'Update Student' : 'Create Student'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
