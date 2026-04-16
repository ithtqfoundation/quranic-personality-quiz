'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Tiebreaker { id: number; juz_a: number; juz_b: number; question_text: string; option_a_description: string; option_b_description: string; }

export default function TiebreakerPage() {
  const [items, setItems] = useState<Tiebreaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({ juz_a: 1, juz_b: 2, question_text: '', option_a_description: '', option_b_description: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tiebreaker', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setItems(data.tiebreakers || []);
    } catch { toast.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditingId(null); setForm({ juz_a: 1, juz_b: 2, question_text: '', option_a_description: '', option_b_description: '' }); setModalOpen(true); };
  const openEdit = (t: Tiebreaker) => { setEditingId(t.id); setForm({ juz_a: t.juz_a, juz_b: t.juz_b, question_text: t.question_text, option_a_description: t.option_a_description, option_b_description: t.option_b_description }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.question_text.trim()) { toast.error('Question text is required'); return; }
    if (form.juz_a === form.juz_b) { toast.error('Juz A and Juz B cannot be the same'); return; }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (editingId) payload.id = editingId;
      const res = await fetch('/api/admin/tiebreaker', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editingId ? 'Updated' : 'Created');
      setModalOpen(false);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tiebreaker?id=${deletingId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Deleted');
      setDeleteOpen(false);
      fetchData();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  // Coverage matrix: which juz pairs have tiebreaker questions
  const coveredPairs = new Set(items.map(t => `${Math.min(t.juz_a, t.juz_b)}-${Math.max(t.juz_a, t.juz_b)}`));

  const columns: Column<Tiebreaker>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'juz_a', label: 'Juz A', sortable: true, className: 'w-20', render: (r) => <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-bold">{r.juz_a}</span> },
    { key: 'juz_b', label: 'Juz B', sortable: true, className: 'w-20', render: (r) => <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-bold">{r.juz_b}</span> },
    { key: 'question_text', label: 'Question', sortable: true, render: (r) => <span className="line-clamp-1 text-sm">{r.question_text}</span> },
    { key: 'option_a_description', label: 'Option A', render: (r) => <span className="text-xs text-gray-400 line-clamp-1">{r.option_a_description}</span> },
    { key: 'option_b_description', label: 'Option B', render: (r) => <span className="text-xs text-gray-400 line-clamp-1">{r.option_b_description}</span> },
  ];

  const juzOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} tiebreaker questions • {coveredPairs.size} unique pairs covered</p>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30"><Plus size={16} /> Add Tiebreaker</button>
      </div>

      <DataTable columns={columns} data={items} searchKeys={['question_text']} searchPlaceholder="Search tiebreaker..." loading={loading} emptyMessage="No tiebreaker questions found"
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"><Pencil size={14} /></button>
            <button onClick={() => { setDeletingId(row.id); setDeleteOpen(true); }} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
          </>
        )}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Tiebreaker' : 'Create Tiebreaker'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Juz A *</label>
              <select value={form.juz_a} onChange={(e) => setForm({ ...form, juz_a: parseInt(e.target.value) })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                {juzOptions.map(j => <option key={j} value={j}>Juz {j}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Juz B *</label>
              <select value={form.juz_b} onChange={(e) => setForm({ ...form, juz_b: parseInt(e.target.value) })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                {juzOptions.map(j => <option key={j} value={j}>Juz {j}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Question Text *</label>
            <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} rows={3} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Option A Description</label>
            <textarea value={form.option_a_description} onChange={(e) => setForm({ ...form, option_a_description: e.target.value })} rows={2} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Option B Description</label>
            <textarea value={form.option_b_description} onChange={(e) => setForm({ ...form, option_b_description: e.target.value })} rows={2} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </FormModal>

      <DeleteConfirmDialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeletingId(null); }} onConfirm={handleDelete} loading={saving} />
    </div>
  );
}
