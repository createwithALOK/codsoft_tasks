'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, getUser, logout } from '@/lib/auth';
import { LayoutDashboard, UtensilsCrossed, Table2, ClipboardList, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/tables', label: 'Tables', icon: Table2 },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    const user = getUser();
    if (user && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [router]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex bg-surface-muted">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-surface-border flex flex-col">
        <div className="px-4 py-5 border-b border-surface-border">
          <Link href="/admin" className="text-xl font-bold text-primary">
            DineDesk
          </Link>
          <p className="text-xs text-text-muted mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-white'
                  : 'text-text hover:bg-surface-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-surface-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface-muted w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
