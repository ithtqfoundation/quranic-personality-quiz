// Admin API Route: Tiebreaker Questions CRUD
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('tiebreaker_questions')
      .select('*')
      .order('juz_a', { ascending: true })
      .order('juz_b', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiebreakers: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();

    if (!body.juz_a || !body.juz_b || !body.question_text) {
      return NextResponse.json(
        { error: 'juz_a, juz_b, and question_text are required' },
        { status: 400 }
      );
    }

    if (body.juz_a === body.juz_b) {
      return NextResponse.json({ error: 'juz_a and juz_b cannot be the same' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tiebreaker_questions')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiebreaker: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tiebreaker id is required' }, { status: 400 });
    }

    if (updateData.juz_a && updateData.juz_b && updateData.juz_a === updateData.juz_b) {
      return NextResponse.json({ error: 'juz_a and juz_b cannot be the same' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tiebreaker_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tiebreaker: data });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tiebreaker id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tiebreaker_questions')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Tiebreaker question deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
