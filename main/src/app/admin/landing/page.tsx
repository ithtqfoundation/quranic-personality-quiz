'use client';

import { useEffect, useState, useCallback } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Save, Trash2, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'hero' | 'manfaat' | 'hasil' | 'cta' | 'footer';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: '🎯' },
  { key: 'manfaat', label: 'Manfaat', icon: '✨' },
  { key: 'hasil', label: 'Hasil', icon: '📊' },
  { key: 'cta', label: 'CTA', icon: '📢' },
  { key: 'footer', label: 'Footer', icon: '📋' },
];

// ============================================
// STABLE SUB-COMPONENTS (defined OUTSIDE the parent to prevent re-creation)
// ============================================

function TextInput({ value, onChange, label, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-300 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      />
    </div>
  );
}

function TextAreaField({ value, onChange, label, rows = 3 }: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-300 mb-1.5 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      />
    </div>
  );
}

function ArrayEditor({ value, onChange, label, itemFields }: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  itemFields: { key: string; label: string; type: 'text' | 'textarea' | 'image' }[];
}) {
  let items: any[] = [];
  try { items = JSON.parse(value || '[]'); } catch { items = []; }

  const updateItems = (newItems: any[]) => onChange(JSON.stringify(newItems));
  const addItem = () => {
    const emptyItem: any = {};
    itemFields.forEach(f => emptyItem[f.key] = '');
    updateItems([...items, emptyItem]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button onClick={addItem} className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
          <Plus size={12} /> Add item
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-[#0f1117] border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <GripVertical size={14} />
                <span className="text-xs font-medium">Item {i + 1}</span>
              </div>
              <button onClick={() => updateItems(items.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
            {itemFields.map(f => (
              f.type === 'image' ? (
                <ImageUploader
                  key={f.key}
                  label={f.label}
                  value={item[f.key] || null}
                  onChange={(url) => { const n = [...items]; n[i] = { ...n[i], [f.key]: url || '' }; updateItems(n); }}
                />
              ) : f.type === 'textarea' ? (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <textarea
                    value={item[f.key] || ''}
                    onChange={(e) => { const n = [...items]; n[i] = { ...n[i], [f.key]: e.target.value }; updateItems(n); }}
                    rows={2}
                    className="w-full bg-[#161923] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{f.label}</label>
                  <input
                    value={item[f.key] || ''}
                    onChange={(e) => { const n = [...items]; n[i] = { ...n[i], [f.key]: e.target.value }; updateItems(n); }}
                    className="w-full bg-[#161923] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LinksEditor({ value, onChange, label }: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  let links: { label: string; url: string }[] = [];
  try { links = JSON.parse(value || '[]'); } catch { links = []; }
  const updateLinks = (newLinks: typeof links) => onChange(JSON.stringify(newLinks));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <button onClick={() => updateLinks([...links, { label: '', url: '' }])} className="text-xs text-emerald-400 hover:underline">+ Add</button>
      </div>
      <div className="space-y-2">
        {links.map((link, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              value={link.label}
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], label: e.target.value }; updateLinks(n); }}
              placeholder="Label"
              className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
            <input
              value={link.url}
              onChange={(e) => { const n = [...links]; n[i] = { ...n[i], url: e.target.value }; updateLinks(n); }}
              placeholder="https://..."
              className="flex-1 bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
            <button onClick={() => updateLinks(links.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LandingPage() {
  const [tab, setTab] = useState<Tab>('hero');
  const [content, setContent] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landing', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setContent(data.content || {});
    } catch { toast.error('Failed to fetch content'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const getValue = useCallback((section: string, key: string, fallback = '') => {
    return content[section]?.[key] ?? fallback;
  }, [content]);

  const setValue = useCallback((section: string, key: string, value: string) => {
    setContent(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  }, []);

  const saveSection = async (section: Tab) => {
    setSaving(true);
    try {
      const sectionData = content[section] || {};
      const entries = Object.entries(sectionData).map(([key, value]) => ({
        key,
        value,
        content_type: key.includes('image') || key.includes('background') ? 'image' : key.includes('url') || key.includes('links') ? 'url' : key.includes('items') ? 'json' : 'text',
      }));

      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, entries }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed');
      toast.success(`${section} section saved`);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-500 border-t-emerald-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#1e2030] rounded-xl p-1 border border-white/10 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#1e2030] rounded-xl border border-white/10 p-6">
        {tab === 'hero' && (
          <div className="space-y-5">
            <TextInput value={getValue('hero', 'badge_text')} onChange={(v) => setValue('hero', 'badge_text', v)} label="Badge Text" placeholder="Durasi 5–10 menit" />
            <TextAreaField value={getValue('hero', 'title')} onChange={(v) => setValue('hero', 'title', v)} label="Title" />
            <TextAreaField value={getValue('hero', 'subtitle')} onChange={(v) => setValue('hero', 'subtitle', v)} label="Subtitle" />
            <ImageUploader label="Background Image" value={getValue('hero', 'background_image') || null} onChange={(url) => setValue('hero', 'background_image', url || '')} />
            <div className="grid grid-cols-2 gap-4">
              <TextInput value={getValue('hero', 'cta_primary_text')} onChange={(v) => setValue('hero', 'cta_primary_text', v)} label="Primary CTA Text" placeholder="Mulai Test" />
              <TextInput value={getValue('hero', 'cta_secondary_text')} onChange={(v) => setValue('hero', 'cta_secondary_text', v)} label="Secondary CTA Text" placeholder="Tentang HTQ" />
            </div>
            <TextInput value={getValue('hero', 'cta_secondary_url')} onChange={(v) => setValue('hero', 'cta_secondary_url', v)} label="Secondary CTA URL" placeholder="https://..." />
          </div>
        )}

        {tab === 'manfaat' && (
          <div className="space-y-5">
            <TextInput value={getValue('manfaat', 'section_title')} onChange={(v) => setValue('manfaat', 'section_title', v)} label="Section Title" placeholder="Manfaat Tes" />
            <ArrayEditor value={getValue('manfaat', 'items')} onChange={(v) => setValue('manfaat', 'items', v)} label="Benefit Cards" itemFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'desc', label: 'Description', type: 'textarea' },
              { key: 'image', label: 'Image', type: 'image' },
            ]} />
          </div>
        )}

        {tab === 'hasil' && (
          <div className="space-y-5">
            <TextInput value={getValue('hasil', 'section_title')} onChange={(v) => setValue('hasil', 'section_title', v)} label="Section Title" placeholder="Hasil yang Kamu Dapatkan" />
            <ImageUploader label="Preview Image (large card)" value={getValue('hasil', 'preview_image') || null} onChange={(url) => setValue('hasil', 'preview_image', url || '')} />
            <ArrayEditor value={getValue('hasil', 'items')} onChange={(v) => setValue('hasil', 'items', v)} label="Result Items" itemFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'image', label: 'Icon Image', type: 'image' },
            ]} />
          </div>
        )}

        {tab === 'cta' && (
          <div className="space-y-5">
            <TextInput value={getValue('cta', 'title')} onChange={(v) => setValue('cta', 'title', v)} label="Title" placeholder="Sudah siap mengenal diri?" />
            <TextAreaField value={getValue('cta', 'description')} onChange={(v) => setValue('cta', 'description', v)} label="Description" />
            <TextInput value={getValue('cta', 'button_text')} onChange={(v) => setValue('cta', 'button_text', v)} label="Button Text" placeholder="Mulai Test" />
            <ImageUploader label="Background Image" value={getValue('cta', 'background_image') || null} onChange={(url) => setValue('cta', 'background_image', url || '')} />
          </div>
        )}

        {tab === 'footer' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <TextInput value={getValue('footer', 'org_name_line1')} onChange={(v) => setValue('footer', 'org_name_line1', v)} label="Org Name Line 1" placeholder="Yayasan Halaqah" />
              <TextInput value={getValue('footer', 'org_name_line2')} onChange={(v) => setValue('footer', 'org_name_line2', v)} label="Org Name Line 2" placeholder="Tadarus Al-Qur'an" />
            </div>
            <TextAreaField value={getValue('footer', 'address')} onChange={(v) => setValue('footer', 'address', v)} label="Address" rows={2} />
            <TextInput value={getValue('footer', 'copyright_text')} onChange={(v) => setValue('footer', 'copyright_text', v)} label="Copyright Text" />
            <LinksEditor value={getValue('footer', 'page_links')} onChange={(v) => setValue('footer', 'page_links', v)} label="Page Links" />
            <LinksEditor value={getValue('footer', 'legal_links')} onChange={(v) => setValue('footer', 'legal_links', v)} label="Legal Links" />
            <LinksEditor value={getValue('footer', 'support_links')} onChange={(v) => setValue('footer', 'support_links', v)} label="Support Links" />
            <LinksEditor value={getValue('footer', 'social_links')} onChange={(v) => setValue('footer', 'social_links', v)} label="Social Links" />
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
          <button onClick={() => saveSection(tab)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50 transition-colors">
            <Save size={16} /> {saving ? 'Saving...' : `Save ${TABS.find(t => t.key === tab)?.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
