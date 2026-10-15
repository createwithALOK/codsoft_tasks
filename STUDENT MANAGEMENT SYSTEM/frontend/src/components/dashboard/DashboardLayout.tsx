'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types';

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
  requiredRole: Role;
}

export default function DashboardLayout({ children, pageTitle, requiredRole }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
    } else if (user.role !== requiredRole) {
      router.replace(`/${user.role.toLowerCase()}`);
    }
  }, [loading, requiredRole, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role !== requiredRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        role={user.role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onLogout={logout}
      />
      <div className={clsx('flex-1 flex flex-col transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
        <Navbar user={user} onMenuClick={() => setCollapsed((c) => !c)} pageTitle={pageTitle} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
