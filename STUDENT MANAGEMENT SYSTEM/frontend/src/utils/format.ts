import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—';
  } catch {
    return '—';
  }
};

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
};

export const formatPercentage = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(1)}%`;
};

export const getInitials = (firstName?: string, lastName?: string): string => {
  const f = firstName?.[0]?.toUpperCase() ?? '';
  const l = lastName?.[0]?.toUpperCase() ?? '';
  return `${f}${l}` || '?';
};

export const gradeColor = (grade: string): string => {
  const map: Record<string, string> = {
    'A+': 'text-emerald-600 bg-emerald-50',
    'A':  'text-emerald-600 bg-emerald-50',
    'B+': 'text-blue-600 bg-blue-50',
    'B':  'text-blue-600 bg-blue-50',
    'C':  'text-yellow-600 bg-yellow-50',
    'D':  'text-orange-600 bg-orange-50',
    'F':  'text-red-600 bg-red-50',
    'AB': 'text-gray-600 bg-gray-50',
  };
  return map[grade] ?? 'text-gray-600 bg-gray-50';
};

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PRESENT: 'text-emerald-700 bg-emerald-100',
    ABSENT:  'text-red-700 bg-red-100',
    LATE:    'text-yellow-700 bg-yellow-100',
    EXCUSED: 'text-blue-700 bg-blue-100',
    PAID:    'text-emerald-700 bg-emerald-100',
    UNPAID:  'text-red-700 bg-red-100',
    PARTIAL: 'text-yellow-700 bg-yellow-100',
    WAIVED:  'text-blue-700 bg-blue-100',
  };
  return map[status] ?? 'text-gray-700 bg-gray-100';
};
