'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { Eye } from 'lucide-react';

interface ResultRow { id: string; user_name: string; user_email: string; final_juz: number | null; personality_name: string | null; branch_category: string | null; had_tie: boolean; completed_at: string | null; }

export default function ResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [loadDetail, setLoadDetail] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/results', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setResults(data.results || []);
    } catch { console.error('Failed'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const viewDetail = async (id: string) => {
    setLoadDetail(true); setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/results?id=${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      setDetail(await res.json());
    } catch { console.error('Failed'); }
    finally { setLoadDetail(false); }
  };

  const columns: Column<ResultRow>[] = [
    { key: 'user_name', label: 'User', sortable: true },
    { key: 'user_email', label: 'Email', render: (r) => <span className="text-xs text-gray-400">{r.user_email}</span> },
    { key: 'final_juz', label: 'Juz', sortable: true, className: 'w-16', render: (r) => r.final_juz ? <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">{r.final_juz}</span> : <span className="text-gray-500">—</span> },
    { key: 'personality_name', label: 'Personality', sortable: true, render: (r) => r.personality_name || '—' },
    { key: 'branch_category', label: 'Branch', sortable: true, className: 'w-20' },
    { key: 'had_tie', label: 'Tie', className: 'w-12', render: (r) => r.had_tie ? <span className="text-amber-400 text-xs">Yes</span> : <span className="text-gray-600 text-xs">No</span> },
    { key: 'completed_at', label: 'Date', sortable: true, className: 'w-28', render: (r) => <span className="text-xs text-gray-500">{r.completed_at ? new Date(r.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span> },
  ];

  return (
    <div className="space-y-6">
      <DataTable columns={columns} data={results} searchKeys={['user_name', 'user_email', 'personality_name']} searchPlaceholder="Search results..." loading={loading}
        actions={(row) => <button onClick={() => viewDetail(row.id)} className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"><Eye size={14} /></button>}
      />

      <FormModal open={detailOpen} onClose={() => setDetailOpen(false)} title="Quiz Result Detail" maxWidth="max-w-lg">
        {loadDetail ? (
          <div className="flex items-center justify-center py-12"><div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" /></div>
        ) : detail ? (
          <div className="space-y-4">
            {detail.user && <div className="bg-[#0f1117] rounded-lg p-3"><p className="text-sm font-medium text-white">{detail.user.name}</p><p className="text-xs text-gray-400">{detail.user.email}</p></div>}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#0f1117] rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Extraversion</span><span className="text-sm font-bold text-white">{detail.result?.extraversion_score ?? '—'}</span></div>
              <div className="bg-[#0f1117] rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Ego</span><span className="text-sm font-bold text-white">{detail.result?.ego_score ?? '—'}</span></div>
              <div className="bg-[#0f1117] rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Neuroticism</span><span className="text-sm font-bold text-white">{detail.result?.neuroticism_score ?? '—'}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0f1117] rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Final Juz</span><span className="text-lg font-bold text-emerald-400">{detail.result?.final_juz ?? '—'}</span></div>
              <div className="bg-[#0f1117] rounded-lg p-3"><span className="text-[10px] text-gray-500 block">Branch</span><span className="text-sm font-bold text-white">{detail.result?.branch_category ?? '—'}</span></div>
            </div>
            {detail.personality && <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3"><p className="text-sm font-bold text-emerald-400">{detail.personality.name}</p><p className="text-xs text-gray-400 mt-1 line-clamp-3">{detail.personality.description}</p></div>}
          </div>
        ) : <p className="text-gray-500 text-center py-8">Not found</p>}
      </FormModal>
    </div>
  );
}
