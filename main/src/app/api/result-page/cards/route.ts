// Public API Route: Result Page Cards (no auth required)
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
