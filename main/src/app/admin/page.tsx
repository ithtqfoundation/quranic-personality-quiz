'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Users, CheckCircle, HelpCircle, Brain } from 'lucide-react';
import type { DashboardStats, RecentQuizActivity } from '@/types/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentQuizActivity[]>([]);
  const [juzDist, setJuzDist] = useState<Record<number, number>>({});
  const [branchDist, setBranchDist] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setStats(data.stats);
        setRecent(data.recentActivity || []);
        setJuzDist(data.juzDistribution || {});
        setBranchDist(data.branchDistribution || {});
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" />
      </div>
    );
  }

  const branchColors: Record<string, string> = {
    EHNH: 'bg-emerald-500',
    EHNL: 'bg-blue-500',
    ELNH: 'bg-purple-500',
    ELNL: 'bg-amber-500',
  };

  const totalBranch = Object.values(branchDist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          value={stats?.totalUsers ?? 0}
          label="Total Users"
          color="emerald"
        />
        <StatsCard
          icon={CheckCircle}
          value={stats?.totalQuizCompleted ?? 0}
          label="Quiz Completed"
          color="blue"
        />
        <StatsCard
          icon={HelpCircle}
          value={stats?.totalQuestions ?? 0}
          label="Total Questions"
          color="purple"
        />
        <StatsCard
          icon={Brain}
          value={stats?.totalActivePersonalities ?? 0}
          label="Active Personalities"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#1e2030] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Recent Quiz Activity</h3>
          </div>
          <div className="divide-y divide-white/5">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">No recent activity</p>
            ) : (
              recent.map((item) => (
                <div className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02]">

  <div className="flex items-center gap-4">

    {item.photo_url && (
      <img
        src={item.photo_url}
        alt={item.userName}
        className="w-12 h-12 rounded-full object-cover border border-white/10"
      />
    )}

    <div className="min-w-0">
      <p className="text-sm font-medium text-white truncate">
        {item.userName}
      </p>
      <p className="text-[11px] text-gray-500 truncate">
        {item.userEmail}
      </p>
    </div>

  </div>

  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm text-emerald-400 font-medium">
                      {item.finalJuz ? `Juz ${item.finalJuz}` : '—'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {item.completedAt ? new Date(item.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="bg-[#1e2030] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Branch Distribution</h3>
          </div>
          <div className="p-5 space-y-4">
            {Object.entries(branchDist).length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">No data yet</p>
            ) : (
              Object.entries(branchDist).map(([branch, count]) => {
                const pct = totalBranch > 0 ? Math.round((count / totalBranch) * 100) : 0;
                return (
                  <div key={branch}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-300">{branch}</span>
                      <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${branchColors[branch] || 'bg-gray-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Juz Distribution */}
      {Object.keys(juzDist).length > 0 && (
        <div className="bg-[#1e2030] rounded-xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Personality Type Distribution (by Juz)</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const count = juzDist[juz] || 0;
                const maxCount = Math.max(...Object.values(juzDist), 1);
                const intensity = count > 0 ? Math.max(0.15, count / maxCount) : 0;
                return (
                  <div
                    key={juz}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center border border-white/5 text-center"
                    style={{
                      backgroundColor: count > 0 ? `rgba(52, 211, 153, ${intensity})` : 'rgba(255,255,255,0.02)',
                    }}
                    title={`Juz ${juz}: ${count} results`}
                  >
                    <span className="text-[10px] text-gray-400">{juz}</span>
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
