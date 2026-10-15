'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import type { Class } from '@/types';

interface ClassForm {
  name: string;
  section: string;
  academicYear: string;
  capacity: string;
  roomNumber: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ClassForm>();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/classes');
      setClasses(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const openAdd = () => { setEditClass(null); reset(); setShowModal(true); };
  const openEdit = (c: Class) => {
    setEditClass(c);
    setValue('name', c.name);
    setValue('section', c.section);
    setValue('academicYear', c.academicYear);
    setValue('capacity', c.capacity.toString());
    setValue('roomNumber', c.roomNumber ?? '');
    setShowModal(true);
  };

  const onSubmit = async (data: ClassForm) => {
    try {
      const payload = { ...data, capacity: parseInt(data.capacity) || 40 };
      if (editClass) {
        await api.put(`/classes/${editClass.id}`, payload);
        toast.success('Class updated.');
      } else {
        await api.post('/classes', payload);
        toast.success('Class created.');
      }
      setShowModal(false);
      fetchClasses();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted.');
      fetchClasses();
    } catch { toast.error('Could not delete.'); }
  };

  return (
    <DashboardLayout pageTitle="Classes" requiredRole="ADMIN">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600 text-sm">{classes.length} classes total</p>
        <Button onClick={openAdd} size="sm"><Plus className="w-4 h-4" /> Add Class</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cls.name} – {cls.section}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{cls.academicYear}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-primary-500" />
                  <span>{cls._count?.students ?? 0} / {cls.capacity} students</span>
                </div>
                {cls.roomNumber && (
                  <div className="text-sm text-gray-600">Room: <span className="font-medium">{cls.roomNumber}</span></div>
                )}
              </div>
              {/* capacity bar */}
              <div className="mt-4">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((cls._count?.students ?? 0) / cls.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editClass ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-row">
            <Input label="Class Name *" placeholder="e.g. Class 10" error={errors.name?.message} {...register('name', { required: 'Required.' })} />
            <Input label="Section *" placeholder="e.g. A" error={errors.section?.message} {...register('section', { required: 'Required.' })} />
          </div>
          <div className="form-row">
            <Input label="Academic Year *" placeholder="e.g. 2026-27" error={errors.academicYear?.message} {...register('academicYear', { required: 'Required.' })} />
            <Input label="Capacity" type="number" placeholder="40" {...register('capacity')} />
          </div>
          <Input label="Room Number" placeholder="e.g. R101" {...register('roomNumber')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editClass ? 'Update' : 'Create Class'}</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
