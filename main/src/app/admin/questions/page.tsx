'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface QuestionOption {
  id?: number;
  option_text: string;
  option_value: string;
  points: number;
  order_number: number;
}

interface Question {
  id: number;
  question_text: string;
  layer: number;
  category: string;
  branch_category: string | null;
  order_number: number;
  juz_reference: number | null;
  ayat_reference: string | null;
  quiz_options: QuestionOption[];
}

const defaultOption: QuestionOption = { option_text: '', option_value: '', points: 0, order_number: 1 };

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterLayer, setFilterLayer] = useState<string>('all');

  // Form state
  const [form, setForm] = useState({
    question_text: '',
    layer: 1,
    category: '',
    branch_category: '',
    order_number: 1,
    juz_reference: '',
    ayat_reference: '',
  });
  const [options, setOptions] = useState<QuestionOption[]>([{ ...defaultOption }, { ...defaultOption, order_number: 2 }]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterLayer !== 'all' ? `/api/admin/questions?layer=${filterLayer}` : '/api/admin/questions';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch { toast.error('Failed to fetch questions'); }
    finally { setLoading(false); }
  }, [filterLayer]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ question_text: '', layer: 1, category: '', branch_category: '', order_number: 1, juz_reference: '', ayat_reference: '' });
    setOptions([{ ...defaultOption }, { ...defaultOption, order_number: 2 }]);
    setModalOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      question_text: q.question_text,
      layer: q.layer,
      category: q.category || '',
      branch_category: q.branch_category || '',
      order_number: q.order_number,
      juz_reference: q.juz_reference?.toString() || '',
      ayat_reference: q.ayat_reference || '',
    });
    setOptions(q.quiz_options.length > 0 ? q.quiz_options : [{ ...defaultOption }, { ...defaultOption, order_number: 2 }]);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) { toast.error('Question text is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        question_text: form.question_text,
        layer: form.layer,
        category: form.category || null,
        branch_category: form.branch_category || null,
        order_number: form.order_number,
        juz_reference: form.juz_reference ? parseInt(form.juz_reference) : null,
        ayat_reference: form.ayat_reference || null,
        options: options.filter(o => o.option_text.trim()),
      };
      if (editingId) payload.id = editingId;

      const res = await fetch('/api/admin/questions', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      toast.success(editingId ? 'Question updated' : 'Question created');
      setModalOpen(false);
      fetchQuestions();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions?id=${deletingId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Question deleted');
      setDeleteOpen(false);
      setDeletingId(null);
      fetchQuestions();
    } catch { toast.error('Failed to delete'); }
    finally { setSaving(false); }
  };

  const columns: Column<Question>[] = [
    { key: 'id', label: 'ID', sortable: true, className: 'w-16' },
    { key: 'question_text', label: 'Question', sortable: true, render: (r) => <span className="line-clamp-2 text-sm">{r.question_text}</span> },
    { key: 'layer', label: 'Layer', sortable: true, className: 'w-20', render: (r) => <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">{r.layer}</span> },
    { key: 'category', label: 'Category', sortable: true, className: 'w-32' },
    { key: 'branch_category', label: 'Branch', sortable: true, className: 'w-24', render: (r) => r.branch_category || '—' },
    { key: 'order_number', label: 'Order', sortable: true, className: 'w-20' },
    { key: 'quiz_options', label: 'Options', className: 'w-20', render: (r) => <span className="text-gray-400">{r.quiz_options?.length || 0}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterLayer}
            onChange={(e) => setFilterLayer(e.target.value)}
            className="bg-[#1e2030] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Layers</option>
            <option value="1">Layer 1</option>
            <option value="2">Layer 2</option>
            <option value="3">Layer 3</option>
            <option value="4">Layer 4</option>
          </select>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors">
          <Plus size={16} /> Add Question
        </button>
      </div>

      <DataTable
        columns={columns}
        data={questions}
        searchKeys={['question_text', 'category']}
        searchPlaceholder="Search questions..."
        loading={loading}
        emptyMessage="No questions found"
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10"><Pencil size={14} /></button>
            <button onClick={() => { setDeletingId(row.id); setDeleteOpen(true); }} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Question' : 'Create Question'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">Question Text *</label>
            <textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} rows={3} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Layer *</label>
              <select value={form.layer} onChange={(e) => setForm({ ...form, layer: parseInt(e.target.value) })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                <option value={1}>Layer 1</option><option value={2}>Layer 2</option><option value={3}>Layer 3</option><option value={4}>Layer 4</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Branch Category</label>
              <input value={form.branch_category} onChange={(e) => setForm({ ...form, branch_category: e.target.value })} placeholder="EHNH, EHNL, ..." className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">Order Number</label>
              <input type="number" value={form.order_number} onChange={(e) => setForm({ ...form, order_number: parseInt(e.target.value) || 0 })} className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Options</label>
              <button onClick={() => setOptions([...options, { ...defaultOption, order_number: options.length + 1 }])} className="text-xs text-emerald-400 hover:underline">+ Add Option</button>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#0f1117] border border-white/10 rounded-lg p-2">
                  <input value={opt.option_text} onChange={(e) => { const n = [...options]; n[i].option_text = e.target.value; setOptions(n); }} placeholder="Option text" className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
                  <input value={opt.option_value} onChange={(e) => { const n = [...options]; n[i].option_value = e.target.value; setOptions(n); }} placeholder="Value" className="w-20 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none text-center" />
                  <input type="number" value={opt.points} onChange={(e) => { const n = [...options]; n[i].points = parseInt(e.target.value) || 0; setOptions(n); }} className="w-12 bg-transparent text-sm text-white focus:outline-none text-center" title="Points" />
                  {options.length > 2 && (
                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </FormModal>

      <DeleteConfirmDialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeletingId(null); }} onConfirm={handleDelete} loading={saving} title="Delete Question" message="This will also delete all associated options." />
    </div>
  );
}
