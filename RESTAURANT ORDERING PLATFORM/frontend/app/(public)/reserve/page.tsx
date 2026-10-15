'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { toast } from '@/components/providers';
import { Table } from '@/types';
import { CalendarDays } from 'lucide-react';

export default function ReservePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    date: '',
    timeSlot: '',
    partySize: '2',
    tableId: '',
    specialRequests: '',
  });
  const [tables, setTables] = useState<Table[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    api
      .get('/api/tables')
      .then((res) => setTables(res.data.data ?? res.data ?? []))
      .catch(() => setTables([]));
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.date) e.date = 'Please select a date';
    if (!form.timeSlot) e.timeSlot = 'Please select a time slot';
    if (!form.partySize || Number(form.partySize) < 1) e.partySize = 'Party size must be at least 1';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (!isAuthenticated()) {
      router.push('/login?returnUrl=/reserve');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/reservations', {
        date: form.date,
        timeSlot: form.timeSlot,
        partySize: Number(form.partySize),
        tableId: form.tableId || undefined,
        specialRequests: form.specialRequests,
      });
      toast('Reservation submitted! We will confirm shortly.', 'success');
      router.push('/orders');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to make reservation. Please try again.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
  ];

  const matchingTables = tables.filter(
    (t) => t.capacity >= Number(form.partySize || 1) && t.status !== 'OCCUPIED'
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <CalendarDays className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-text">Reserve a Table</h1>
      </div>

      {!isAuthenticated() && (
        <p className="mb-6 text-sm text-text-muted">
          You will be asked to sign in before the booking is submitted.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField label="Date" error={errors.date}>
          <Input
            type="date"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </FormField>

        <FormField label="Time Slot" error={errors.timeSlot}>
          <Select
            value={form.timeSlot}
            onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
          >
            <option value="">Select a time…</option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Party Size" error={errors.partySize}>
          <Input
            type="number"
            min={1}
            max={20}
            value={form.partySize}
            onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value, tableId: '' }))}
          />
        </FormField>

        <FormField label="Preferred Table (optional)">
          <Select
            value={form.tableId}
            onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))}
          >
            <option value="">Auto-assign a table</option>
            {matchingTables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.tableNumber} · {table.capacity} seats
                {table.location ? ` · ${table.location}` : ''}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Special Requests (optional)">
          <Textarea
            placeholder="Allergies, birthday celebration, wheelchair access…"
            value={form.specialRequests}
            onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))}
          />
        </FormField>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" /> Submitting…
            </span>
          ) : (
            'Reserve Now'
          )}
        </Button>
      </form>
    </div>
  );
}
