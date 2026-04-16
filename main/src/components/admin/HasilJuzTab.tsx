'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Trash2, Save, GripVertical, X, Image as ImageIcon, Type, Heading } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/admin/ImageUploader';
import type { ResultPageCard, ResultPageCardType, ResultPageBlockType, ResultPageCardBlock } from '@/types/result-page';

const CARD_TYPE_LABELS: Record<ResultPageCardType, string> = {
  custom: 'Custom',
  personality_description: 'Gambaran Umum (Personality)',
  personality_strengths: 'Kekuatan Utama (Personality)',
  personality_challenges: 'Tantangan (Personality)',
};

const CARD_TYPE_BADGE_COLORS: Record<ResultPageCardType, string> = {
  custom: 'bg-blue-500/10 text-blue-400',
  personality_description: 'bg-purple-500/10 text-purple-400',
  personality_strengths: 'bg-emerald-500/10 text-emerald-400',
  personality_challenges: 'bg-amber-500/10 text-amber-400',
};

type BlockDraft = Omit<ResultPageCardBlock, 'id' | 'card_id'> & { localId: string };

function makeBlock(type: ResultPageBlockType, order: number): BlockDraft {
  return { localId: crypto.randomUUID(), block_type: type, content: '', order_number: order };
}

// ── Block Editor ──────────────────────────────────────────────────────────────
function BlockEditor({ blocks, onChange }: { blocks: BlockDraft[]; onChange: (b: BlockDraft[]) => void }) {
  const addBlock = (type: ResultPageBlockType) => {
    onChange([...blocks, makeBlock(type, blocks.length)]);
  };

  const removeBlock = (localId: string) => {
    onChange(blocks.filter((b) => b.localId !== localId));
  };

  const updateContent = (localId: string, content: string) => {
    onChange(blocks.map((b) => (b.localId === localId ? { ...b, content } : b)));
  };

  const moveBlock = (localId: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.localId === localId);
    if (idx + dir < 0 || idx + dir >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next.map((b, i) => ({ ...b, order_number: i })));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {blocks.map((block, idx) => (
          <div key={block.localId} className="bg-[#0a0d14] border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${block.block_type === 'heading' ? 'bg-yellow-500/10 text-yellow-400' : block.block_type === 'image' ? 'bg-sky-500/10 text-sky-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {block.block_type}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveBlock(block.localId, -1)} disabled={idx === 0} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 text-xs">↑</button>
                <button onClick={() => moveBlock(block.localId, 1)} disabled={idx === blocks.length - 1} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 text-xs">↓</button>
                <button onClick={() => removeBlock(block.localId)} className="p-1 text-gray-500 hover:text-red-400"><X size={12} /></button>
              </div>
            </div>
            {block.block_type === 'image' ? (
              <ImageUploader
                label=""
                value={block.content || null}
                onChange={(url) => updateContent(block.localId, url || '')}
              />
            ) : (
              block.block_type === 'heading' ? (
                <input
                  value={block.content}
                  onChange={(e) => updateContent(block.localId, e.target.value)}
                  placeholder="Judul section..."
                  className="w-full bg-[#161923] border border-white/5 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              ) : (
                <textarea
                  value={block.content}
                  onChange={(e) => updateContent(block.localId, e.target.value)}
                  rows={3}
                  placeholder="Isi teks..."
                  className="w-full bg-[#161923] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                />
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => addBlock('heading')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20">
          <Heading size={12} /> Heading
        </button>
        <button onClick={() => addBlock('text')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20">
          <Type size={12} /> Text
        </button>
        <button onClick={() => addBlock('image')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20">
          <ImageIcon size={12} /> Image
        </button>
      </div>
    </div>
  );
}

// ── Card Modal ────────────────────────────────────────────────────────────────
function CardModal({
  open,
  onClose,
  onSave,
  initial,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, cardType: ResultPageCardType, blocks: BlockDraft[]) => void;
  initial?: ResultPageCard | null;
  saving: boolean;
}) {
  const [title, setTitle] = useState('');
  const [cardType, setCardType] = useState<ResultPageCardType>('custom');
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '');
      setCardType((initial?.card_type as ResultPageCardType) || 'custom');
      setBlocks(
        (initial?.blocks || []).map((b) => ({
          localId: crypto.randomUUID(),
          block_type: b.block_type as ResultPageBlockType,
          content: b.content,
          order_number: b.order_number,
        }))
      );
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e2030] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-white font-semibold">{initial ? 'Edit Card' : 'Add Card'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Title (untuk admin)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama card..."
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {/* Card Type */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Card Type</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value as ResultPageCardType)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              {(Object.keys(CARD_TYPE_LABELS) as ResultPageCardType[]).map((t) => (
                <option key={t} value={t}>{CARD_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Block Editor or Personality info */}
          {cardType === 'custom' ? (
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Blok Konten</label>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>
          ) : (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-sm text-purple-300">
              Konten card ini diambil otomatis dari data Personality per Juz. Kelola kontennya di menu <strong>Personality</strong>.
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/5">
            Cancel
          </button>
          <button
            onClick={() => onSave(title, cardType, blocks)}
            disabled={saving || !title.trim()}
            className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main HasilJuzTab ──────────────────────────────────────────────────────────
export function HasilJuzTab() {
  const [cards, setCards] = useState<ResultPageCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ResultPageCard | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Drag state
  const dragIdx = useRef<number | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/result-page/cards', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      toast.error('Gagal memuat cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleSave = async (title: string, cardType: ResultPageCardType, blocks: BlockDraft[]) => {
    setSaving(true);
    try {
      const payload = {
        title,
        card_type: cardType,
        order_number: editingCard ? editingCard.order_number : cards.length,
        blocks: cardType === 'custom'
          ? blocks.map(({ block_type, content, order_number }) => ({ block_type, content, order_number }))
          : [],
      };

      const url = '/api/admin/result-page/cards';
      const method = editingCard ? 'PUT' : 'POST';
      const body = editingCard ? { id: editingCard.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }

      toast.success(editingCard ? 'Card diperbarui' : 'Card ditambahkan');
      setModalOpen(false);
      setEditingCard(null);
      fetchCards();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (card: ResultPageCard) => {
    try {
      const res = await fetch('/api/admin/result-page/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card.id, is_active: !card.is_active }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(card.is_active ? 'Card dinonaktifkan' : 'Card diaktifkan');
      fetchCards();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/result-page/cards?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Card dihapus');
      setDeleteId(null);
      fetchCards();
    } catch {
      toast.error('Gagal menghapus');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const payload = cards.map((c, i) => ({ id: c.id, order_number: i + 1 }));
      const res = await fetch('/api/admin/result-page/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: payload }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Urutan disimpan');
      setOrderDirty(false);
      fetchCards();
    } catch {
      toast.error('Gagal menyimpan urutan');
    } finally {
      setSaving(false);
    }
  };

  // HTML5 Drag-and-drop
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...cards];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, moved);
    dragIdx.current = idx;
    setCards(next);
    setOrderDirty(true);
  };
  const handleDragEnd = () => { dragIdx.current = null; };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{cards.length} card{cards.length !== 1 ? 's' : ''} · drag untuk reorder</p>
        <div className="flex items-center gap-2">
          {orderDirty && (
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/25 disabled:opacity-50"
            >
              <Save size={14} /> Save Order
            </button>
          )}
          <button
            onClick={() => { setEditingCard(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/25"
          >
            <Plus size={14} /> Add Card
          </button>
        </div>
      </div>

      {/* Card List */}
      <div className="space-y-2">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-3 bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 cursor-grab active:cursor-grabbing group hover:border-white/20 transition-colors"
          >
            <GripVertical size={16} className="text-gray-600 flex-shrink-0" />

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${CARD_TYPE_BADGE_COLORS[card.card_type as ResultPageCardType]}`}>
                {card.card_type === 'custom' ? 'custom' : 'personality'}
              </span>
              <span className="text-sm text-white truncate">{card.title}</span>
              {card.card_type === 'custom' && (
                <span className="text-xs text-gray-500 flex-shrink-0">{card.blocks.length} blok</span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Toggle active */}
              <button
                onClick={() => handleToggleActive(card)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${card.is_active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-red-500/10 text-red-400 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
              >
                {card.is_active ? 'Aktif' : 'Nonaktif'}
              </button>
              {/* Edit */}
              <button
                onClick={() => { setEditingCard(card); setModalOpen(true); }}
                className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5"
              >
                ✏
              </button>
              {/* Delete */}
              {deleteId === card.id ? (
                <>
                  <button onClick={() => handleDelete(card.id)} disabled={saving} className="px-2 py-1 text-[10px] rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50">
                    {saving ? '...' : 'Hapus?'}
                  </button>
                  <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-[10px] rounded bg-white/5 text-gray-400 hover:bg-white/10">
                    Batal
                  </button>
                </>
              ) : (
                <button onClick={() => setDeleteId(card.id)} className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            Belum ada card. Klik &quot;Add Card&quot; untuk mulai.
          </div>
        )}
      </div>

      {/* Modal */}
      <CardModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCard(null); }}
        onSave={handleSave}
        initial={editingCard}
        saving={saving}
      />
    </div>
  );
}
