// Admin API Route: Result Page Cards CRUD
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';
import type { ResultPageCardUpdate } from '@/types/database';

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

    const updateData: ResultPageCardUpdate = { updated_at: new Date().toISOString() };
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
