import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PLACED':
      return 'bg-blue-100 text-blue-800';
    case 'CONFIRMED':
      return 'bg-indigo-100 text-indigo-800';
    case 'PREPARING':
      return 'bg-yellow-100 text-yellow-800';
    case 'READY':
      return 'bg-green-100 text-green-800';
    case 'DELIVERED':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'PENDING':
      return 'bg-orange-100 text-orange-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800';
    case 'OCCUPIED':
      return 'bg-red-100 text-red-800';
    case 'RESERVED':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function spiceLevelCount(level: string | number | undefined | null): number {
  if (level === undefined || level === null || level === '') return 0;
  if (typeof level === 'number') return Math.min(3, Math.max(0, level));
  const normalized = String(level).toUpperCase();
  if (normalized === 'MILD') return 1;
  if (normalized === 'MEDIUM') return 2;
  if (normalized === 'HOT') return 3;
  const parsed = parseInt(normalized, 10);
  return Number.isNaN(parsed) ? 0 : Math.min(3, Math.max(0, parsed));
}
