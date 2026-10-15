'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  FileText, CreditCard, LogOut, ChevronLeft, School,
} from 'lucide-react';
import type { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',  href: '/admin',           icon: <LayoutDashboard className="w-5 h-5" />, roles: ['ADMIN'] },
  { label: 'Students',   href: '/admin/students',  icon: <GraduationCap className="w-5 h-5" />,  roles: ['ADMIN'] },
  { label: 'Teachers',   href: '/admin/teachers',  icon: <Users className="w-5 h-5" />,          roles: ['ADMIN'] },
  { label: 'Classes',    href: '/admin/classes',   icon: <School className="w-5 h-5" />,         roles: ['ADMIN'] },
  { label: 'Fees',       href: '/admin/fees',      icon: <CreditCard className="w-5 h-5" />,     roles: ['ADMIN'] },
  { label: 'Exams',      href: '/admin/exams',     icon: <FileText className="w-5 h-5" />,       roles: ['ADMIN'] },

  { label: 'Dashboard',   href: '/teacher',              icon: <LayoutDashboard className="w-5 h-5" />, roles: ['TEACHER'] },
  { label: 'My Classes',  href: '/teacher/attendance',   icon: <ClipboardCheck className="w-5 h-5" />, roles: ['TEACHER'] },
  { label: 'Exams',       href: '/teacher/exams',        icon: <FileText className="w-5 h-5" />,       roles: ['TEACHER'] },
  { label: 'Grades',      href: '/teacher/grades',       icon: <BookOpen className="w-5 h-5" />,       roles: ['TEACHER'] },

  { label: 'Dashboard',  href: '/student',               icon: <LayoutDashboard className="w-5 h-5" />, roles: ['STUDENT'] },
  { label: 'Attendance', href: '/student/attendance',    icon: <ClipboardCheck className="w-5 h-5" />, roles: ['STUDENT'] },
  { label: 'Results',    href: '/student/results',       icon: <FileText className="w-5 h-5" />,       roles: ['STUDENT'] },
  { label: 'Fees',       href: '/student/fees',          icon: <CreditCard className="w-5 h-5" />,     roles: ['STUDENT'] },
];

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export default function Sidebar({ role, collapsed, onToggle, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight">EduManage</span>}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{role}</span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href.split('/').length > 2);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-gray-700 px-2 py-4 space-y-1">
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ChevronLeft className={clsx('w-5 h-5 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
