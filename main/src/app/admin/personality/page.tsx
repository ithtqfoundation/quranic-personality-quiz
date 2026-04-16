'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalityType {
  id: number;
  juz_number: number;
  name: string;
  description: string | null;
  strengths: string[] | null;
  challenges: string[] | null;
  development_advice: string | null;
  ayat_references: string[] | null;
  is_active: boolean;
}

// Defined OUTSIDE the main component to avoid re-creation on every render (fixes lost-focus bug)
function ArrayInput({ label, items: arr, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button type="button" onClick={() => onChange([...arr, ''])} className="text-xs text-emerald-400 hover:underline">+ Add</button>
      </div>
      <div className="space-y-1.5">
        {arr.map((val, i) => (
          <div key={i} className="flex gap-2">
            <input value={val} onChange={(e) => { const n = [...arr]; n[i] = e.target.value; onChange(n); }} className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            {arr.length > 1 && <button onClick={() => onChange(arr.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PersonalityPage() {
  const [items, setItems] = useState<PersonalityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({ juz_number: 1, name: '', description: '', development_advice: '', is_active: true });
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [ayatRefs, setAyatRefs] = useState<string[]>(['']);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/personality', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setItems(data.personalities || []);
    } catch { toast.error('Failed to fetch'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ juz_number: 1, name: '', description: '', development_advice: '', is_active: true });
    setStrengths(['']); setChallenges(['']); setAyatRefs(['']);
    setModalOpen(true);
  };

  const openEdit = (p: PersonalityType) => {
    setEditingId(p.id);
    setForm({ juz_number: p.juz_number, name: p.name, description: p.description || '', development_advice: p.development_advice || '', is_active: p.is_active });
    setStrengths(p.strengths?.length ? p.strengths : ['']);
    setChallenges(p.challenges?.length ? p.challenges : ['']);
    setAyatRefs(p.ayat_references?.length ? p.ayat_references : ['']);
    setModalOpen(true);
  };

  const toggleActive = async (p: PersonalityType) => {
    try {
      const res = await fetch('/api/admin/personality', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, is_active: !p.is_active }), credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success(`${p.name} ${!p.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch { toast.error('Failed to toggle'); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        strengths: strengths.filter(s => s.trim()),
        challenges: challenges.filter(s => s.trim()),
        ayat_references: ayatRefs.filter(s => s.trim()),
      };
      if (editingId) payload.id = editingId;

      const res = await fetch('/api/admin/personality', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
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
      const res = await fetch(`/api/admin/personality?id=${deletingId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Deleted');
      setDeleteOpen(false);
      fetchData();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };



  const columns: Column<PersonalityType>[] = [
    { key: 'juz_number', label: 'Juz', sortable: true, className: 'w-16', render: (r) => <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs font-bold">{r.juz_number}</span> },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', render: (r) => <span className="text-gray-400 line-clamp-1 text-xs">{r.description || '—'}</span> },
    { key: 'strengths', label: 'Strengths', className: 'w-20', render: (r) => <span className="text-gray-400">{r.strengths?.length || 0}</span> },
    { key: 'challenges', label: 'Challenges', className: 'w-24', render: (r) => <span className="text-gray-400">{r.challenges?.length || 0}</span> },
    { key: 'is_active', label: 'Status', className: 'w-24', render: (r) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30"><Plus size={16} /> Add Personality</button>
      </div>

      <DataTable columns={columns} data={items} searchKeys={['name', 'description']} searchPlaceholder="Search personality types..." loading={loading} emptyMessage="No personality types found"
        actions={(row) => (
          <>
            <button onClick={() => toggleActive(row)} className={`p-1.5 rounded ${row.is_active ? 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10' : 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`} title={row.is_active ? 'Deactivate' : 'Activate'}>{row.is_active ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"><Pencil size={14} /></button>
            <button onClick={() => { setDeletingId(row.id); setDeleteOpen(true); }} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
          </>
        )}
      />

      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Personality Type' : 'Create Personality Type'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Juz Number *</label>
              <input type="number" min={1} max={30} value={form.juz_number} onChange={(e) => setForm({ ...form, juz_number: parseInt(e.target.value) || 1 })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <ArrayInput label="Strengths" items={strengths} onChange={setStrengths} />
          <ArrayInput label="Challenges" items={challenges} onChange={setChallenges} />
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Development Advice</label>
            <textarea value={form.development_advice} onChange={(e) => setForm({ ...form, development_advice: e.target.value })} rows={2} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <ArrayInput label="Ayat References" items={ayatRefs} onChange={setAyatRefs} />
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Active</label>
            <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-600'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
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
