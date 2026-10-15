'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDate, statusColor } from '@/utils/format';
import api from '@/lib/axios';
import type { Fee, FeeStructure, Student } from '@/types';

export default function AdminFeesPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<{ total: number; paid: number; unpaid: number; totalRevenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<string | null>(null);

  const structureForm = useForm<{ name: string; amount: string; academicYear: string; dueDate: string; description: string }>();
  const assignForm = useForm<{ studentId: string; feeStructureId: string }>();
  const payForm = useForm<{ amountPaid: string; paymentMethod: string; transactionId: string; remarks: string }>();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [feesRes, structRes, statsRes, studRes] = await Promise.all([
        api.get('/fees'),
        api.get('/fees/structures'),
        api.get('/fees/stats'),
        api.get('/students', { params: { limit: 200 } }),
      ]);
      setFees(feesRes.data.data);
      setStructures(structRes.data.data);
      setStats(statsRes.data.data);
      setStudents(studRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onCreateStructure = async (data: { name: string; amount: string; academicYear: string; dueDate: string; description: string }) => {
    try {
      await api.post('/fees/structures', data);
      toast.success('Fee structure created.');
      setShowStructureModal(false);
      structureForm.reset();
      fetchAll();
    } catch { toast.error('Error creating structure.'); }
  };

  const onAssignFee = async (data: { studentId: string; feeStructureId: string }) => {
    try {
      await api.post('/fees/assign', data);
      toast.success('Fee assigned.');
      setShowAssignModal(false);
      assignForm.reset();
      fetchAll();
    } catch { toast.error('Error assigning fee.'); }
  };

  const onRecordPayment = async (data: { amountPaid: string; paymentMethod: string; transactionId: string; remarks: string }) => {
    try {
      await api.put(`/fees/${showPayModal}/pay`, data);
      toast.success('Payment recorded.');
      setShowPayModal(null);
      payForm.reset();
      fetchAll();
    } catch { toast.error('Error recording payment.'); }
  };

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (f: Fee) => (
        <div>
          <p className="font-medium text-gray-900">{f.student?.firstName} {f.student?.lastName}</p>
          <p className="text-xs text-gray-500">{f.student?.admissionNumber}</p>
        </div>
      ),
    },
    { key: 'feeName', header: 'Fee', render: (f: Fee) => f.feeStructure?.name ?? '—' },
    { key: 'amount', header: 'Total', render: (f: Fee) => formatCurrency(f.feeStructure?.amount ?? 0) },
    { key: 'paid', header: 'Paid', render: (f: Fee) => formatCurrency(f.amountPaid) },
    {
      key: 'status',
      header: 'Status',
      render: (f: Fee) => <Badge label={f.status} className={statusColor(f.status)} />,
    },
    { key: 'paymentDate', header: 'Paid On', render: (f: Fee) => formatDate(f.paymentDate) },
    {
      key: 'actions',
      header: '',
      render: (f: Fee) => f.status !== 'PAID' ? (
        <Button size="sm" onClick={() => { setShowPayModal(f.id); payForm.reset(); }}>
          Record Payment
        </Button>
      ) : (
        <span className="text-xs text-emerald-600 font-medium">✓ Paid</span>
      ),
    },
  ];

  const studentOptions = students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.admissionNumber})` }));
  const structureOptions = structures.map((s) => ({ value: s.id, label: `${s.name} — ${formatCurrency(s.amount)}` }));

  return (
    <DashboardLayout pageTitle="Fee Management" requiredRole="ADMIN">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Records" value={stats?.total ?? 0} icon={<CreditCard className="w-5 h-5" />} color="blue" />
        <StatCard title="Paid" value={stats?.paid ?? 0} icon={<CheckCircle className="w-5 h-5" />} color="green" />
        <StatCard title="Unpaid" value={stats?.unpaid ?? 0} icon={<XCircle className="w-5 h-5" />} color="red" />
        <StatCard title="Revenue Collected" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={<AlertCircle className="w-5 h-5" />} color="yellow" />
      </div>

      <Card padding={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Fee Records</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowStructureModal(true)}>
              <Plus className="w-4 h-4" /> Fee Structure
            </Button>
            <Button size="sm" onClick={() => setShowAssignModal(true)}>
              <Plus className="w-4 h-4" /> Assign Fee
            </Button>
          </div>
        </div>
        <div className="p-5">
          <Table columns={columns} data={fees} loading={loading} keyExtractor={(f) => f.id} emptyMessage="No fee records." />
        </div>
      </Card>

      {/* Create Structure Modal */}
      <Modal isOpen={showStructureModal} onClose={() => setShowStructureModal(false)} title="Create Fee Structure">
        <form onSubmit={structureForm.handleSubmit(onCreateStructure)} className="space-y-4">
          <Input label="Name *" placeholder="e.g. Annual Tuition Fee" {...structureForm.register('name', { required: true })} />
          <div className="form-row">
            <Input label="Amount (₹) *" type="number" {...structureForm.register('amount', { required: true })} />
            <Input label="Academic Year *" placeholder="2026-27" {...structureForm.register('academicYear', { required: true })} />
          </div>
          <Input label="Due Date *" type="date" {...structureForm.register('dueDate', { required: true })} />
          <Input label="Description" {...structureForm.register('description')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowStructureModal(false)}>Cancel</Button>
            <Button type="submit" loading={structureForm.formState.isSubmitting}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Fee Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Fee to Student">
        <form onSubmit={assignForm.handleSubmit(onAssignFee)} className="space-y-4">
          <Select label="Student *" options={studentOptions} placeholder="Select student" {...assignForm.register('studentId', { required: true })} />
          <Select label="Fee Structure *" options={structureOptions} placeholder="Select fee structure" {...assignForm.register('feeStructureId', { required: true })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button type="submit" loading={assignForm.formState.isSubmitting}>Assign</Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!showPayModal} onClose={() => setShowPayModal(null)} title="Record Payment">
        <form onSubmit={payForm.handleSubmit(onRecordPayment)} className="space-y-4">
          <Input label="Amount Paid (₹) *" type="number" {...payForm.register('amountPaid', { required: true })} />
          <Select
            label="Payment Method"
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'ONLINE', label: 'Online Payment' },
              { value: 'CHEQUE', label: 'Cheque' },
            ]}
            {...payForm.register('paymentMethod')}
          />
          <Input label="Transaction ID" {...payForm.register('transactionId')} />
          <Input label="Remarks" {...payForm.register('remarks')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowPayModal(null)}>Cancel</Button>
            <Button type="submit" loading={payForm.formState.isSubmitting}>Record Payment</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
