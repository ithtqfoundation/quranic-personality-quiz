// Admin API Route: Result Page Cards Reorder
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
