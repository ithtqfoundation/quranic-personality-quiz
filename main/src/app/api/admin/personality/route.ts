// Admin API Route: Personality Types CRUD
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('personality_types')
      .select('*')
      .order('juz_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ personalities: data || [] });
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

    if (!body.juz_number || !body.name) {
      return NextResponse.json({ error: 'juz_number and name are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('personality_types')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ personality: data }, { status: 201 });
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
      return NextResponse.json({ error: 'Personality type id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('personality_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ personality: data });
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
      return NextResponse.json({ error: 'Personality type id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('personality_types')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Personality type deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
