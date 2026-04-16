'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: { value: string; positive: boolean };
  color?: 'emerald' | 'blue' | 'purple' | 'amber';
}

const colorMap = {
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400',
    border: 'border-amber-500/20',
  },
};

export function StatsCard({ icon: Icon, value, label, trend, color = 'emerald' }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5 transition-all hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          <Icon size={20} className={colors.icon} />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend.positive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
