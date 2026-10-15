'use client';

import { Bell, Menu } from 'lucide-react';
import { getInitials } from '@/utils/format';
import type { User } from '@/types';

interface NavbarProps {
  user: User;
  onMenuClick: () => void;
  pageTitle: string;
}

export default function Navbar({ user, onMenuClick, pageTitle }: NavbarProps) {
  const profile = user.profile as Record<string, string> | undefined;
  const firstName = profile?.firstName ?? '';
  const lastName = profile?.lastName ?? '';
  const initials = getInitials(firstName, lastName) || user.email[0].toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {firstName ? `${firstName} ${lastName}` : user.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
