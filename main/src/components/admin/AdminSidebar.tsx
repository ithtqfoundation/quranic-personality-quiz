'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import {
  LayoutDashboard,
  Globe,
  HelpCircle,
  Brain,
  Scale,
  Users,
  ClipboardList,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import type { AdminUser } from '@/lib/admin-guard';

interface AdminSidebarProps {
  adminUser: AdminUser;
}

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content Management',
    items: [
      { href: '/admin/landing', icon: Globe, label: 'Landing Page' },
      { href: '/admin/questions', icon: HelpCircle, label: 'Questions' },
      { href: '/admin/personality', icon: Brain, label: 'Personality Types' },
      { href: '/admin/tiebreaker', icon: Scale, label: 'Tiebreaker' },
    ],
  },
  {
    label: 'Data & Users',
    items: [
      { href: '/admin/users', icon: Users, label: 'Users' },
      { href: '/admin/results', icon: ClipboardList, label: 'Quiz Results' },
    ],
  },
];

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image src="/htq-logo.png" alt="HTQ" width={36} height={36} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">HTQ Admin</p>
            <p className="text-[10px] text-gray-400 truncate">Content Manager</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={18} className={active ? 'text-emerald-400' : ''} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: Back to Site */}
      <div className="border-t border-white/10 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? 'Back to Site' : undefined}
        >
          <ChevronLeft size={18} />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button (rendered in header area on mobile) */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#1e2030] p-2 rounded-lg text-gray-400 hover:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          bg-[#0f1117] border-r border-white/10
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}

        {/* Collapse toggle (desktop only) */}
        <button
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center bg-[#1e2030] border border-white/10 rounded-full text-gray-400 hover:text-white"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  );
}
