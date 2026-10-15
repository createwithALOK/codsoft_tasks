import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 text-3xl font-bold text-primary">
        DineDesk
      </Link>
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-surface-border p-8">
        {children}
      </div>
    </div>
  );
}
