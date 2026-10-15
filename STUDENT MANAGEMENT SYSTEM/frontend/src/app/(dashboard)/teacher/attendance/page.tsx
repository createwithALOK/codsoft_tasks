'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { statusColor } from '@/utils/format';
import api from '@/lib/axios';
import type { Class, Student, AttendanceStatus } from '@/types';

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/classes').then((res) => setClasses(res.data.data));
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);

    // Fetch students in class + any existing attendance
    Promise.all([
      api.get('/students', { params: { classId: selectedClass, limit: 100 } }),
      api.get('/attendance', { params: { classId: selectedClass, date } }),
    ]).then(([studRes, attRes]) => {
      const studs: Student[] = studRes.data.data;
      setStudents(studs);

      // Pre-fill existing records
      const existing: Record<string, AttendanceRecord> = {};
      for (const att of (attRes.data.data as { studentId: string; status: AttendanceStatus; remarks: string }[])) {
        existing[att.studentId] = { studentId: att.studentId, status: att.status, remarks: att.remarks ?? '' };
      }

      // Default remaining to PRESENT
      const init: Record<string, AttendanceRecord> = {};
      for (const s of studs) {
        init[s.id] = existing[s.id] ?? { studentId: s.id, status: 'PRESENT', remarks: '' };
      }
      setRecords(init);
    }).finally(() => setLoading(false));
  }, [selectedClass, date]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...records };
    Object.keys(updated).forEach((id) => { updated[id] = { ...updated[id], status }; });
    setRecords(updated);
  };

  const handleSave = async () => {
    if (!selectedClass) { toast.error('Select a class first.'); return; }
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        classId: selectedClass,
        date,
        records: Object.values(records),
      });
      toast.success('Attendance saved successfully!');
    } catch { toast.error('Failed to save attendance.'); } finally { setSaving(false); }
  };

  const statusOptions: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.name} – ${c.section}` }));

  const summary = Object.values(records).reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <DashboardLayout pageTitle="Mark Attendance" requiredRole="TEACHER">
      <Card>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select
            label="Select Class"
            options={classOptions}
            placeholder="Choose a class..."
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="sm:w-64"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDate(e.target.value)}
              className="block rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {selectedClass && students.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-3 mb-4">
              {statusOptions.map((s) => (
                <span key={s} className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(s)}`}>
                  {s}: {summary[s] ?? 0}
                </span>
              ))}
            </div>

            {/* Quick mark all */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-sm text-gray-500 self-center">Mark all:</span>
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleMarkAll(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition hover:opacity-80 ${statusColor(s)}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Student list */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student) => {
                  const rec = records[student.id];
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {statusOptions.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(student.id, s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border-2 transition ${
                              rec?.status === s
                                ? `${statusColor(s)} border-current`
                                : 'border-gray-200 text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            {s[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} loading={saving} size="lg">Save Attendance</Button>
            </div>
          </>
        )}

        {selectedClass && students.length === 0 && !loading && (
          <p className="text-sm text-gray-500 py-8 text-center">No students enrolled in this class.</p>
        )}

        {!selectedClass && (
          <p className="text-sm text-gray-400 py-8 text-center">Select a class and date to mark attendance.</p>
        )}
      </Card>
    </DashboardLayout>
  );
}
