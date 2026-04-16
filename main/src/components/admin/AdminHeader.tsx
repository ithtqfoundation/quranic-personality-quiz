'use client';

import { usePathname } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import type { AdminUser } from '@/lib/admin-guard';

interface AdminHeaderProps {
  adminUser: AdminUser;
}

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/landing': 'Landing Page',
  '/admin/questions': 'Questions',
  '/admin/personality': 'Personality Types',
  '/admin/tiebreaker': 'Tiebreaker',
  '/admin/users': 'Users',
  '/admin/results': 'Quiz Results',
};

export function AdminHeader({ adminUser }: AdminHeaderProps) {
  const pathname = usePathname();

  const title = pageTitles[pathname] || 'Admin';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-[#0f1117] border-b border-white/10 shrink-0">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        {/* Spacer for mobile menu button */}
        <div className="w-10 lg:hidden" />
        <div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-[11px] text-gray-500">
            HTQ Personality Quiz — Admin Panel
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
        </button>

        {/* Admin info */}
        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
            {adminUser.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-[120px]">
              {adminUser.name}
            </p>
            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
              {adminUser.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
