# Design Spec: Hasil Juz Card System

**Date:** 2026-04-16  
**Status:** Approved  
**Scope:** Admin Landing Page — new "Hasil Juz" tab + card-driven result page

---

## Overview

Menambahkan sistem card yang sepenuhnya dikelola admin untuk halaman `/result` (halaman hasil quiz). Admin dapat menambah, menghapus, mengatur urutan, dan mengisi konten card. Setiap card bisa berisi blok-blok fleksibel (teks, heading, gambar). Card bertipe `personality_*` mengambil konten otomatis dari tabel `personality_types` yang sudah ada — admin hanya mengatur posisinya.

---

## 1. Database Schema

### Tabel: `result_page_cards`

```sql
create table result_page_cards (
  id           serial primary key,
  title        text not null,                      -- label untuk admin, tidak tampil di UI publik
  card_type    text not null default 'custom',     -- 'custom' | 'personality_description' | 'personality_strengths' | 'personality_challenges'
  order_number integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
```

### Tabel: `result_page_card_blocks`

```sql
create table result_page_card_blocks (
  id           serial primary key,
  card_id      integer not null references result_page_cards(id) on delete cascade,
  block_type   text not null,                      -- 'text' | 'image' | 'heading'
  content      text not null default '',           -- teks biasa atau URL gambar
  order_number integer not null default 0
);
```

**Notes:**
- Card tipe `personality_*` tidak memiliki rows di `result_page_card_blocks` — blok tidak relevan untuk tipe ini.
- `on delete cascade` memastikan blocks ikut terhapus saat card dihapus.
- Seed data default: tiga card personality dengan order 1, 2, 3 agar halaman hasil tetap berfungsi sebelum admin mengatur ulang.

---

## 2. API Layer

### `/api/admin/result-page/cards` (requires admin auth)

| Method | Behavior |
|--------|----------|
| `GET` | Kembalikan semua cards + blocks, diurutkan by `order_number` |
| `POST` | Buat card baru; body: `{ title, card_type, order_number?, blocks? }` |
| `PUT` | Update card; body: `{ id, title?, card_type?, order_number?, is_active?, blocks? }`. Jika `blocks` disertakan, replace semua blocks card tersebut. |
| `DELETE ?id=` | Hapus card (blocks cascade) |

### `/api/admin/result-page/reorder` (requires admin auth)

| Method | Behavior |
|--------|----------|
| `PUT` | Terima `{ cards: [{ id, order_number }] }`, batch update order semua cards |

### `/api/result-page/cards` (public, no auth)

| Method | Behavior |
|--------|----------|
| `GET` | Kembalikan cards aktif (`is_active = true`) + blocks, diurutkan by `order_number`. Cards tipe `personality_*` dikembalikan dengan `blocks: []`. |

**Response shape (public endpoint):**
```json
{
  "cards": [
    {
      "id": 1,
      "card_type": "personality_description",
      "order_number": 1,
      "is_active": true,
      "blocks": []
    },
    {
      "id": 4,
      "card_type": "custom",
      "order_number": 4,
      "title": "Tips Pengembangan",
      "is_active": true,
      "blocks": [
        { "id": 1, "block_type": "heading", "content": "Langkah Selanjutnya", "order_number": 1 },
        { "id": 2, "block_type": "text", "content": "...", "order_number": 2 },
        { "id": 3, "block_type": "image", "content": "https://...", "order_number": 3 }
      ]
    }
  ]
}
```

---

## 3. Admin UI

### Lokasi
Tab baru **"Hasil Juz"** (icon: 📜) di halaman `/admin/landing`, sejajar dengan Hero, Manfaat, Hasil, CTA, Footer.

### Layout Tab

```
┌─────────────────────────────────────────────────────┐
│  + Add Card                            [Save Order]  │
├─────────────────────────────────────────────────────┤
│  ⠿  [personality_description]  Gambaran Umum  ● ✏ 🗑 │
│  ⠿  [personality_strengths]   Kekuatan Utama  ● ✏ 🗑 │
│  ⠿  [personality_challenges]  Tantangan       ● ✏ 🗑 │
│  ⠿  [custom]  Tips Pengembangan               ● ✏ 🗑 │
└─────────────────────────────────────────────────────┘
```

- `⠿` = drag handle untuk reorder
- `●` = toggle aktif/nonaktif
- Tombol "Save Order" muncul hanya setelah ada perubahan urutan (dirty state)

### Modal Add/Edit Card

**Field selalu tampil:**
- Title (input text) — label untuk admin
- Card Type (dropdown): Custom / Gambaran Umum / Kekuatan Utama / Tantangan

**Jika Card Type = `custom`:** tampilkan Block Editor
- Tombol: `+ Add Heading`, `+ Add Text`, `+ Add Image`
- Setiap blok: drag handle (urutan), field konten (input/textarea/ImageUploader), tombol hapus
- Blok dirender preview-style di modal (heading lebih besar, teks normal, image thumbnail)

**Jika Card Type = `personality_*`:** tampilkan info box:
> "Konten card ini diambil otomatis dari data Personality per Juz. Kelola kontennya di menu Personality."

### Komponen Admin yang Dipakai Ulang
- `ImageUploader` — untuk blok tipe image
- `GripVertical` (lucide) — drag handle
- `Trash2`, `Plus`, `Save` — sudah ada
- `FormModal`, `DeleteConfirmDialog` — sudah ada

---

## 4. Frontend — Halaman `/result`

### Data Fetching

`result/page.tsx` fetch dua hal paralel:
1. Data quiz result + personality (sudah ada)
2. `GET /api/result-page/cards`

### Refactor `HasilJuz`

Komponen `HasilJuz` direfactor menjadi card-driven. Props baru:

```typescript
interface HasilJuzProps {
  result?: any;
  cards: ResultPageCard[];  // dari /api/result-page/cards
}
```

Render loop:
```typescript
cards.map(card => {
  if (card.card_type === 'personality_description') return <PersonalityDescriptionCard personality={personality} />
  if (card.card_type === 'personality_strengths')   return <PersonalityStrengthsCard personality={personality} />
  if (card.card_type === 'personality_challenges')  return <PersonalityChallengesCard personality={personality} />
  if (card.card_type === 'custom')                  return <ResultCard card={card} />
})
```

### Komponen Baru: `ResultCard`

```typescript
// src/components/result-page/result-card.tsx
export function ResultCard({ card }: { card: ResultPageCard }) {
  return (
    <div className="...">
      {card.blocks.map(block => {
        if (block.block_type === 'heading') return <h3 key={block.id}>{block.content}</h3>
        if (block.block_type === 'text')    return <p key={block.id}>{block.content}</p>
        if (block.block_type === 'image')   return <Image key={block.id} src={block.content} ... />
      })}
    </div>
  )
}
```

### Fallback

Jika fetch `/api/result-page/cards` gagal atau mengembalikan array kosong, `HasilJuz` render urutan hard-coded:
1. personality_description
2. personality_strengths  
3. personality_challenges

Header card (nama juz + background + tagline) dan `KonsultasiCard` **tidak** masuk sistem card — tetap hard-coded.

---

## 5. TypeScript Types

```typescript
// src/types/result-page.ts
export interface ResultPageCardBlock {
  id: number;
  card_id: number;
  block_type: 'text' | 'image' | 'heading';
  content: string;
  order_number: number;
}

export type ResultPageCardType =
  | 'custom'
  | 'personality_description'
  | 'personality_strengths'
  | 'personality_challenges';

export interface ResultPageCard {
  id: number;
  title: string;
  card_type: ResultPageCardType;
  order_number: number;
  is_active: boolean;
  blocks: ResultPageCardBlock[];
}
```

---

## 6. Out of Scope

- Header card halaman hasil (nama juz, tagline, background image) — tetap hard-coded
- `KonsultasiCard` — tetap hard-coded
- Rich text editor (bold, italic, dll) untuk blok teks — cukup plain text
- Per-juz custom cards — semua card bersifat global

---

## 7. Migration / Seed

SQL seed untuk memastikan halaman hasil tetap berfungsi setelah deployment:

```sql
insert into result_page_cards (title, card_type, order_number) values
  ('Gambaran Umum', 'personality_description', 1),
  ('Kekuatan Utama', 'personality_strengths', 2),
  ('Tantangan', 'personality_challenges', 3);
```
