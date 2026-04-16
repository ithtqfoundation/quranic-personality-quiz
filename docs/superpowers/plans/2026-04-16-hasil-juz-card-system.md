# Hasil Juz Card System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambahkan sistem card yang dikelola admin di halaman `/result` — admin bisa menambah, menghapus, mengatur urutan card, dan mengisi setiap card dengan blok teks/gambar fleksibel. Card tipe `personality_*` auto-render dari data personality per juz.

**Architecture:** Dua tabel baru di Supabase (`result_page_cards` + `result_page_card_blocks`), tiga API route baru, satu komponen admin tab baru (`HasilJuzTab`), satu komponen frontend baru (`ResultCard`), dan refactor `HasilJuz` menjadi card-driven. Halaman `/result` fetch cards via public API, fallback ke urutan hard-coded jika gagal.

**Tech Stack:** Next.js 15 App Router, Supabase (service role client untuk admin API), TypeScript, Tailwind CSS, lucide-react, HTML5 Drag-and-Drop API (built-in, tanpa library tambahan)

---

## File Map

| File | Status | Tanggung Jawab |
|------|--------|---------------|
| `main/src/types/result-page.ts` | Buat baru | TypeScript types untuk cards dan blocks |
| `main/src/types/database.ts` | Modifikasi | Tambah DB row types untuk dua tabel baru |
| `main/src/lib/constants.ts` | Modifikasi | Tambah `RESULT_PAGE_API_ROUTES` |
| `main/supabase/migrations/20260416_result_page_cards.sql` | Buat baru | DDL + seed SQL untuk dua tabel baru |
| `main/src/app/api/admin/result-page/cards/route.ts` | Buat baru | Admin CRUD API untuk cards + blocks |
| `main/src/app/api/admin/result-page/reorder/route.ts` | Buat baru | Admin batch reorder API |
| `main/src/app/api/result-page/cards/route.ts` | Buat baru | Public GET API untuk halaman `/result` |
| `main/src/components/admin/HasilJuzTab.tsx` | Buat baru | UI tab admin: card list, drag reorder, block editor modal |
| `main/src/app/admin/landing/page.tsx` | Modifikasi | Tambah tab "Hasil Juz", render `HasilJuzTab` |
| `main/src/components/result-page/result-card.tsx` | Buat baru | Render satu custom card dengan blok-bloknya |
| `main/src/components/result-page/hasil-juz.tsx` | Modifikasi | Refactor menjadi card-driven renderer |
| `main/src/app/result/page.tsx` | Modifikasi | Fetch cards paralel, pass ke `HasilJuz` |

---

## Task 1: TypeScript Types + Constants

**Files:**
- Buat: `main/src/types/result-page.ts`
- Modifikasi: `main/src/types/database.ts`
- Modifikasi: `main/src/lib/constants.ts`

- [ ] **Step 1: Buat file types**

Buat `main/src/types/result-page.ts`:

```typescript
export type ResultPageCardType =
  | 'custom'
  | 'personality_description'
  | 'personality_strengths'
  | 'personality_challenges';

export type ResultPageBlockType = 'text' | 'image' | 'heading';

export interface ResultPageCardBlock {
  id: number;
  card_id: number;
  block_type: ResultPageBlockType;
  content: string;
  order_number: number;
}

export interface ResultPageCard {
  id: number;
  title: string;
  card_type: ResultPageCardType;
  order_number: number;
  is_active: boolean;
  blocks: ResultPageCardBlock[];
}

// Shape for creating/updating a card from the admin UI
export interface ResultPageCardPayload {
  title: string;
  card_type: ResultPageCardType;
  order_number?: number;
  is_active?: boolean;
  blocks?: Omit<ResultPageCardBlock, 'id' | 'card_id'>[];
}
```

- [ ] **Step 2: Tambah DB types di `database.ts`**

Buka `main/src/types/database.ts`. Di dalam `Tables` (sesudah `landing_content`), tambahkan:

```typescript
      result_page_cards: {
        Row: {
          id: number;
          title: string;
          card_type: string;
          order_number: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          card_type?: string;
          order_number?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          card_type?: string;
          order_number?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      result_page_card_blocks: {
        Row: {
          id: number;
          card_id: number;
          block_type: string;
          content: string;
          order_number: number;
        };
        Insert: {
          id?: number;
          card_id: number;
          block_type: string;
          content?: string;
          order_number?: number;
        };
        Update: {
          id?: number;
          card_id?: number;
          block_type?: string;
          content?: string;
          order_number?: number;
        };
      };
```

Di akhir file, setelah baris `export type LandingContentUpdate`, tambahkan:

```typescript
export type ResultPageCardRow = Database['public']['Tables']['result_page_cards']['Row'];
export type ResultPageCardBlockRow = Database['public']['Tables']['result_page_card_blocks']['Row'];
```

- [ ] **Step 3: Tambah API route constants di `constants.ts`**

Buka `main/src/lib/constants.ts`. Setelah blok `ADMIN_API_ROUTES`, tambahkan:

```typescript
export const RESULT_PAGE_API_ROUTES = {
  CARDS: '/api/result-page/cards',
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add main/src/types/result-page.ts main/src/types/database.ts main/src/lib/constants.ts
git commit -m "feat(result-page): add TypeScript types and constants for card system"
```

---

## Task 2: Database Migration SQL

**Files:**
- Buat: `main/supabase/migrations/20260416_result_page_cards.sql`

- [ ] **Step 1: Buat direktori dan file migration**

```bash
mkdir -p main/supabase/migrations
```

Buat `main/supabase/migrations/20260416_result_page_cards.sql`:

```sql
-- Create result_page_cards table
create table if not exists result_page_cards (
  id           serial primary key,
  title        text not null,
  card_type    text not null default 'custom',
  order_number integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Create result_page_card_blocks table
create table if not exists result_page_card_blocks (
  id           serial primary key,
  card_id      integer not null references result_page_cards(id) on delete cascade,
  block_type   text not null,
  content      text not null default '',
  order_number integer not null default 0
);

-- Indexes
create index if not exists idx_result_page_cards_order on result_page_cards(order_number);
create index if not exists idx_result_page_card_blocks_card_id on result_page_card_blocks(card_id);
create index if not exists idx_result_page_card_blocks_order on result_page_card_blocks(order_number);

-- Seed: default personality cards so the result page works immediately
insert into result_page_cards (title, card_type, order_number, is_active) values
  ('Gambaran Umum', 'personality_description', 1, true),
  ('Kekuatan Utama', 'personality_strengths', 2, true),
  ('Tantangan', 'personality_challenges', 3, true)
on conflict do nothing;
```

- [ ] **Step 2: Jalankan SQL di Supabase**

Buka Supabase Dashboard → SQL Editor → paste isi file SQL di atas → Run.

Verifikasi:
```sql
select * from result_page_cards;
-- Harus mengembalikan 3 baris seed (Gambaran Umum, Kekuatan Utama, Tantangan)
```

- [ ] **Step 3: Commit**

```bash
git add main/supabase/migrations/20260416_result_page_cards.sql
git commit -m "feat(result-page): add DB migration for result_page_cards and blocks tables"
```

---

## Task 3: Admin API — CRUD Cards

**Files:**
- Buat: `main/src/app/api/admin/result-page/cards/route.ts`

- [ ] **Step 1: Buat direktori dan file route**

```bash
mkdir -p main/src/app/api/admin/result-page/cards
```

Buat `main/src/app/api/admin/result-page/cards/route.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

// GET — semua cards dengan blocks, diurutkan by order_number
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();

    const { data: cards, error: cardsError } = await supabase
      .from('result_page_cards')
      .select('*')
      .order('order_number', { ascending: true });

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    const { data: blocks, error: blocksError } = await supabase
      .from('result_page_card_blocks')
      .select('*')
      .order('order_number', { ascending: true });

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    const result = (cards || []).map((card) => ({
      ...card,
      blocks: (blocks || []).filter((b) => b.card_id === card.id),
    }));

    return NextResponse.json({ cards: result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — buat card baru (dengan blocks opsional)
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { title, card_type = 'custom', order_number = 0, is_active = true, blocks = [] } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const { data: card, error: cardError } = await supabase
      .from('result_page_cards')
      .insert({ title: title.trim(), card_type, order_number, is_active, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    let savedBlocks: any[] = [];
    if (blocks.length > 0) {
      const blockRows = blocks.map((b: any, i: number) => ({
        card_id: card.id,
        block_type: b.block_type,
        content: b.content || '',
        order_number: b.order_number ?? i,
      }));

      const { data: insertedBlocks, error: blocksError } = await supabase
        .from('result_page_card_blocks')
        .insert(blockRows)
        .select();

      if (blocksError) {
        return NextResponse.json({ error: blocksError.message }, { status: 500 });
      }
      savedBlocks = insertedBlocks || [];
    }

    return NextResponse.json({ card: { ...card, blocks: savedBlocks } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — update card; jika blocks disertakan, replace semua blocks card
export async function PUT(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id, blocks, ...cardFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (cardFields.title !== undefined) updateData.title = cardFields.title;
    if (cardFields.card_type !== undefined) updateData.card_type = cardFields.card_type;
    if (cardFields.order_number !== undefined) updateData.order_number = cardFields.order_number;
    if (cardFields.is_active !== undefined) updateData.is_active = cardFields.is_active;

    const { data: card, error: cardError } = await supabase
      .from('result_page_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    let savedBlocks: any[] = [];
    if (Array.isArray(blocks)) {
      // Replace semua blocks: hapus lama, insert baru
      await supabase.from('result_page_card_blocks').delete().eq('card_id', id);

      if (blocks.length > 0) {
        const blockRows = blocks.map((b: any, i: number) => ({
          card_id: id,
          block_type: b.block_type,
          content: b.content || '',
          order_number: b.order_number ?? i,
        }));

        const { data: insertedBlocks, error: blocksError } = await supabase
          .from('result_page_card_blocks')
          .insert(blockRows)
          .select();

        if (blocksError) {
          return NextResponse.json({ error: blocksError.message }, { status: 500 });
        }
        savedBlocks = insertedBlocks || [];
      }
    } else {
      // Tidak ada blocks di payload, fetch yang sudah ada
      const { data: existingBlocks } = await supabase
        .from('result_page_card_blocks')
        .select('*')
        .eq('card_id', id)
        .order('order_number', { ascending: true });
      savedBlocks = existingBlocks || [];
    }

    return NextResponse.json({ card: { ...card, blocks: savedBlocks } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — hapus card (blocks cascade)
export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('result_page_cards')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Card deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verifikasi manual**

Pastikan dev server berjalan (`npm run dev` di folder `main`). Buka browser, masuk sebagai admin, lalu di console:

```javascript
// GET — harus dapat 3 card seed
fetch('/api/admin/result-page/cards', { credentials: 'include' })
  .then(r => r.json()).then(console.log);
```

Expected: `{ cards: [{ id: 1, title: 'Gambaran Umum', card_type: 'personality_description', ... }, ...] }`

- [ ] **Step 3: Commit**

```bash
git add main/src/app/api/admin/result-page/cards/route.ts
git commit -m "feat(result-page): add admin CRUD API for result page cards"
```

---

## Task 4: Admin API — Reorder

**Files:**
- Buat: `main/src/app/api/admin/result-page/reorder/route.ts`

- [ ] **Step 1: Buat direktori dan file route**

```bash
mkdir -p main/src/app/api/admin/result-page/reorder
```

Buat `main/src/app/api/admin/result-page/reorder/route.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

// PUT — batch update order_number untuk semua cards
export async function PUT(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { cards } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'cards array is required' }, { status: 400 });
    }

    // Jalankan update satu per satu (Supabase tidak support batch update via upsert dengan filter berbeda)
    const updates = await Promise.all(
      cards.map(({ id, order_number }: { id: number; order_number: number }) =>
        supabase
          .from('result_page_cards')
          .update({ order_number, updated_at: new Date().toISOString() })
          .eq('id', id)
      )
    );

    const failed = updates.find((u) => u.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Order updated' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add main/src/app/api/admin/result-page/reorder/route.ts
git commit -m "feat(result-page): add admin reorder API for result page cards"
```

---

## Task 5: Public API — Result Page Cards

**Files:**
- Buat: `main/src/app/api/result-page/cards/route.ts`

- [ ] **Step 1: Buat direktori dan file route**

```bash
mkdir -p main/src/app/api/result-page/cards
```

Buat `main/src/app/api/result-page/cards/route.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// GET — public, tanpa auth
// Mengembalikan active cards + blocks diurutkan by order_number
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: cards, error: cardsError } = await supabase
      .from('result_page_cards')
      .select('*')
      .eq('is_active', true)
      .order('order_number', { ascending: true });

    if (cardsError) {
      return NextResponse.json({ error: cardsError.message }, { status: 500 });
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json({ cards: [] });
    }

    const cardIds = cards.map((c) => c.id);

    const { data: blocks, error: blocksError } = await supabase
      .from('result_page_card_blocks')
      .select('*')
      .in('card_id', cardIds)
      .order('order_number', { ascending: true });

    if (blocksError) {
      return NextResponse.json({ error: blocksError.message }, { status: 500 });
    }

    const result = cards.map((card) => ({
      id: card.id,
      card_type: card.card_type,
      order_number: card.order_number,
      is_active: card.is_active,
      title: card.title,
      blocks: (blocks || []).filter((b) => b.card_id === card.id),
    }));

    return NextResponse.json({ cards: result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verifikasi manual**

```javascript
// Di browser console (tidak perlu login)
fetch('/api/result-page/cards')
  .then(r => r.json()).then(console.log);
```

Expected: `{ cards: [{ id: 1, card_type: 'personality_description', order_number: 1, blocks: [] }, ...] }`

- [ ] **Step 3: Commit**

```bash
git add main/src/app/api/result-page/cards/route.ts
git commit -m "feat(result-page): add public API endpoint for result page cards"
```

---

## Task 6: Admin UI — HasilJuzTab Component

**Files:**
- Buat: `main/src/components/admin/HasilJuzTab.tsx`
- Modifikasi: `main/src/app/admin/landing/page.tsx`

- [ ] **Step 1: Buat `HasilJuzTab.tsx`**

Buat `main/src/components/admin/HasilJuzTab.tsx`:

```typescript
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
            Belum ada card. Klik "Add Card" untuk mulai.
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
```

- [ ] **Step 2: Tambah tab "Hasil Juz" di `landing/page.tsx`**

Buka `main/src/app/admin/landing/page.tsx`.

Tambah import di atas:
```typescript
import { HasilJuzTab } from '@/components/admin/HasilJuzTab';
```

Ubah array `TABS` — tambah entry baru:
```typescript
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'hero', label: 'Hero', icon: '🎯' },
  { key: 'manfaat', label: 'Manfaat', icon: '✨' },
  { key: 'hasil', label: 'Hasil', icon: '📊' },
  { key: 'cta', label: 'CTA', icon: '📢' },
  { key: 'footer', label: 'Footer', icon: '📋' },
  { key: 'hasil_juz', label: 'Hasil Juz', icon: '📜' },
];
```

Ubah tipe `Tab`:
```typescript
type Tab = 'hero' | 'manfaat' | 'hasil' | 'cta' | 'footer' | 'hasil_juz';
```

Di dalam JSX, di dalam `<div className="bg-[#1e2030] rounded-xl border border-white/10 p-6">`, tambahkan sebelum blok `{/* Save Button */}`:
```tsx
{tab === 'hasil_juz' && (
  <HasilJuzTab />
)}
```

Tab `hasil_juz` punya save button sendiri di dalam `HasilJuzTab`, jadi sembunyikan tombol save global untuk tab ini. Bungkus blok save button yang sudah ada:

```tsx
{/* Save Button — tidak tampil untuk hasil_juz karena punya save sendiri */}
{tab !== 'hasil_juz' && (
  <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
    <button onClick={() => saveSection(tab)} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50 transition-colors">
      <Save size={16} /> {saving ? 'Saving...' : `Save ${TABS.find(t => t.key === tab)?.label}`}
    </button>
  </div>
)}
```

- [ ] **Step 3: Verifikasi di browser**

1. Buka `http://localhost:3000/admin/landing`
2. Klik tab "Hasil Juz" (📜)
3. Harus muncul 3 card dari seed data
4. Klik "+ Add Card", pilih type Custom, isi title, tambah blok teks/gambar, save
5. Card baru harus muncul di list
6. Drag card untuk reorder, klik "Save Order"
7. Toggle aktif/nonaktif

- [ ] **Step 4: Commit**

```bash
git add main/src/components/admin/HasilJuzTab.tsx main/src/app/admin/landing/page.tsx
git commit -m "feat(admin): add Hasil Juz tab with card and block editor to Landing Page admin"
```

---

## Task 7: Frontend — ResultCard Component

**Files:**
- Buat: `main/src/components/result-page/result-card.tsx`

- [ ] **Step 1: Buat komponen**

Buat `main/src/components/result-page/result-card.tsx`:

```typescript
import Image from 'next/image';
import type { ResultPageCard } from '@/types/result-page';

interface ResultCardProps {
  card: ResultPageCard;
}

export function ResultCard({ card }: ResultCardProps) {
  if (!card.blocks || card.blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 py-4">
      {card.blocks.map((block) => {
        if (block.block_type === 'heading') {
          return (
            <p
              key={block.id}
              className="lg:text-[22px] text-[16px] text-[#006557] font-bold pb-2 border-b border-neutral-200 w-full"
            >
              {block.content}
            </p>
          );
        }

        if (block.block_type === 'text') {
          return (
            <p
              key={block.id}
              className="text-justify lg:text-[18px] text-[14px]"
            >
              {block.content}
            </p>
          );
        }

        if (block.block_type === 'image' && block.content) {
          return (
            <div key={block.id} className="w-full flex justify-center">
              <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden">
                <Image
                  src={block.content}
                  alt=""
                  fill
                  className="object-contain"
                  unoptimized={block.content.startsWith('http')}
                />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add main/src/components/result-page/result-card.tsx
git commit -m "feat(result-page): add ResultCard component for custom card blocks"
```

---

## Task 8: Frontend — Refactor HasilJuz + Result Page

**Files:**
- Modifikasi: `main/src/components/result-page/hasil-juz.tsx`
- Modifikasi: `main/src/app/result/page.tsx`

- [ ] **Step 1: Refactor `hasil-juz.tsx`**

Ganti seluruh isi `main/src/components/result-page/hasil-juz.tsx`:

```typescript
import React from 'react';
import { Check } from 'lucide-react';
import { ResultCard } from './result-card';
import type { ResultPageCard } from '@/types/result-page';

// ── Personality sub-cards ─────────────────────────────────────────────────────

function PersonalityDescription({ description }: { description: string }) {
  return (
    <div className="pt-9.25">
      <div className="lg:text-[18px] text-[14px] flex flex-col gap-4 items-start">
        <p className="lg:text-[22px] text-[16px] text-[#006557] font-bold pb-2 border-b border-neutral-200 w-full">
          Gambaran Umum
        </p>
        <p className="text-justify text-center lg:text-[18px] text-[14px]">{description}</p>
      </div>
    </div>
  );
}

function PersonalityStrengths({ strengths }: { strengths: string[] }) {
  return (
    <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
      <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b border-neutral-200 w-full text-[#006557]">
        Kekuatan Utama
      </p>
      <div className="w-full flex flex-col gap-2 mt-2">
        {strengths.length > 0 ? (
          strengths.map((s, i) => (
            <span key={i}>
              <Check className="inline-block mr-2 text-tosca" size={24} />
              <span>{s}</span>
              {i !== strengths.length - 1 && <span>, </span>}
            </span>
          ))
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}

function PersonalityChallenges({ challenges }: { challenges: string[] }) {
  return (
    <div className="rounded-[10px] shadow-sm bg-neutral-50 px-5.5 pt-7 pb-13 flex-1">
      <p className="font-bold lg:text-[22px] text-[16px] pb-[9px] border-b border-neutral-200 w-full text-[#006557]">
        Tantangan yang Perlu Disadari
      </p>
      <div className="w-full flex flex-col gap-2 mt-2">
        {challenges.length > 0 ? (
          challenges.map((c, i) => (
            <span key={i}>
              <div className="inline-block mr-2 bg-neutral-200-400 rounded-full w-[15px] h-[15px]" />
              <span>{c}</span>
              {i !== challenges.length - 1 && <span>, </span>}
            </span>
          ))
        ) : (
          <p />
        )}
      </div>
    </div>
  );
}

// ── Fallback order ketika cards kosong / gagal fetch ──────────────────────────
const FALLBACK_CARDS: Pick<ResultPageCard, 'id' | 'card_type' | 'order_number' | 'is_active' | 'title' | 'blocks'>[] = [
  { id: -1, card_type: 'personality_description', order_number: 1, is_active: true, title: 'Gambaran Umum', blocks: [] },
  { id: -2, card_type: 'personality_strengths',   order_number: 2, is_active: true, title: 'Kekuatan Utama', blocks: [] },
  { id: -3, card_type: 'personality_challenges',  order_number: 3, is_active: true, title: 'Tantangan', blocks: [] },
];

// ── Main export ───────────────────────────────────────────────────────────────
interface HasilJuzProps {
  result?: any;
  cards: ResultPageCard[];
}

export default function HasilJuz({ result, cards }: HasilJuzProps) {
  if (!result) return null;

  const personality = result.personality ?? {};
  const name: string = personality.name ?? 'Hasil';
  const tagline: string = personality.tagline ?? '';
  const description: string = personality.description ?? 'Deskripsi tidak tersedia.';
  const strengths: string[] = personality.strengths ?? [];
  const challenges: string[] = personality.challenges ?? [];

  const activeCards = cards.length > 0 ? cards : FALLBACK_CARDS;

  // Kumpulkan card personality berurutan agar bisa di-wrap dalam satu flex row
  // (strengths + challenges tampil side-by-side seperti desain aslinya)
  const renderCard = (card: typeof activeCards[0], idx: number) => {
    if (!card.is_active) return null;

    if (card.card_type === 'personality_description') {
      return <PersonalityDescription key={card.id} description={description} />;
    }

    // Strengths dan challenges: cek apakah keduanya adjacent, render side-by-side
    if (card.card_type === 'personality_strengths') {
      const nextCard = activeCards[idx + 1];
      const nextIsChallenge = nextCard?.card_type === 'personality_challenges' && nextCard.is_active;
      if (nextIsChallenge) {
        // Render pair side-by-side
        return (
          <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
            <PersonalityStrengths strengths={strengths} />
            <PersonalityChallenges challenges={challenges} />
          </div>
        );
      }
      return (
        <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
          <PersonalityStrengths strengths={strengths} />
        </div>
      );
    }

    // Skip challenges jika sudah dirender bersama strengths di atas
    if (card.card_type === 'personality_challenges') {
      const prevCard = activeCards[idx - 1];
      if (prevCard?.card_type === 'personality_strengths' && prevCard.is_active) return null;
      return (
        <div key={card.id} className="flex lg:flex-row flex-col items-stretch justify-center gap-[25px]">
          <PersonalityChallenges challenges={challenges} />
        </div>
      );
    }

    if (card.card_type === 'custom') {
      return <ResultCard key={card.id} card={card as ResultPageCard} />;
    }

    return null;
  };

  return (
    <div id="hasil-juz-root" className="flex flex-col lg:gap-8 gap-4 mt-4.5">
      {/* Header card — hard-coded, tidak masuk sistem card */}
      <div>
        <div
          className="relative bg-neutral-50 text-neutral-25 rounded-[10px] bg-no-repeat lg:bg-[length:100.94%_376.958%] lg:bg-[-6px_-13px] bg-[length:100%_auto] bg-[0px_0px] md:bg-[length:100%_250%] md:bg-[0px_-10px] bg-center before:absolute before:inset-0 before:bg-[rgba(61,159,142,0.20)] before:rounded-[10px] before:z-0 px-4 pt-20 pb-6 xxs:pt-32 xxs:pb-8 xs:px-8 xs:pt-34 xs:pb-8 md:px-40 md:py-8 lg:px-50 lg:py-12 xl:pt-17 xl:pb-16 xl:pl-81.5 xl:pr-99"
          style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.10)), url(/image/juz-result-bg.webp)' }}
        >
          <h4 className="relative z-10 font-bold lg:text-[38px] text-[26px]">{name}</h4>
          <p className="relative z-10 lg:text-[22px] text-[16px]">{tagline}</p>
        </div>

        {/* Card-driven content */}
        {activeCards.map((card, idx) => renderCard(card, idx))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `result/page.tsx` agar fetch cards**

Buka `main/src/app/result/page.tsx`. Tambah import di atas:

```typescript
import type { ResultPageCard } from '@/types/result-page';
```

Tambah state baru setelah state `error`:
```typescript
const [resultCards, setResultCards] = useState<ResultPageCard[]>([]);
```

Tambah `useEffect` baru setelah `useEffect` yang sudah ada untuk `loadResult`:
```typescript
useEffect(() => {
  fetch('/api/result-page/cards')
    .then((r) => r.json())
    .then((data) => setResultCards(data.cards || []))
    .catch(() => setResultCards([]));
}, []);
```

Update pemanggilan `HasilJuz` agar menyertakan `cards`:
```tsx
{result && <HasilJuz result={result} cards={resultCards} />}
```

- [ ] **Step 3: Verifikasi end-to-end di browser**

1. Buka `http://localhost:3000/result` (pastikan ada result yang tersimpan, atau selesaikan quiz)
2. Halaman harus tetap tampil normal dengan Gambaran Umum, Kekuatan Utama, Tantangan
3. Buka admin → Landing Page → tab Hasil Juz
4. Add card Custom dengan beberapa blok (heading + text + image)
5. Refresh `/result` — card baru harus muncul di posisi yang ditentukan
6. Nonaktifkan salah satu card di admin → refresh `/result` → card tersebut tidak muncul
7. Reorder cards di admin → save order → refresh `/result` → urutan berubah

- [ ] **Step 4: Commit**

```bash
git add main/src/components/result-page/hasil-juz.tsx main/src/app/result/page.tsx
git commit -m "feat(result-page): refactor HasilJuz to card-driven rendering with API-managed layout"
```

---

## Checklist Spec Coverage

| Requirement | Task |
|-------------|------|
| Global cards (sama semua juz) | Task 5 public API + Task 8 fetch |
| Admin atur urutan bebas (drag-and-drop) | Task 6 HasilJuzTab |
| Card punya blok-blok fleksibel (text/image/heading) | Task 6 BlockEditor |
| Personality cards auto dari DB, layout dikustomisasi | Task 8 HasilJuz refactor |
| Tab baru di admin Landing Page | Task 6 landing/page.tsx |
| DB tables + migration | Task 2 |
| TypeScript types | Task 1 |
| Fallback ke hard-coded jika API gagal | Task 8 FALLBACK_CARDS |
| Toggle aktif/nonaktif card | Task 6 handleToggleActive |
| Delete card (cascade blocks) | Task 3 DELETE + Task 6 handleDelete |
