'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    if (user && user.role !== 'KITCHEN' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Minimal dark header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <Link href="/kitchen" className="text-xl font-bold text-primary">
          DineDesk Kitchen
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
