// Admin API Route: Landing Page Content CRUD
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// GET — Public (no auth needed) — used by landing page to fetch content
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    let query = supabase
      .from('landing_content')
      .select('*')
      .eq('is_active', true)
      .order('section')
      .order('order_number', { ascending: true });

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by section for easier consumption
    const grouped: Record<string, Record<string, string>> = {};
    (data || []).forEach((item) => {
      if (!grouped[item.section]) grouped[item.section] = {};
      grouped[item.section][item.key] = item.value || '';
    });

    return NextResponse.json({ content: grouped, raw: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create or update a single landing content entry (upsert)
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();

    if (!body.section || !body.key) {
      return NextResponse.json({ error: 'section and key are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('landing_content')
      .upsert(
        {
          section: body.section,
          key: body.key,
          content_type: body.content_type || 'text',
          value: body.value ?? null,
          order_number: body.order_number ?? 0,
          is_active: body.is_active ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'section,key' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag('landing-content', { expire: 0 });
    return NextResponse.json({ content: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT — Bulk update a section's content
export async function PUT(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { section, entries } = body;

    if (!section || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'section and entries array are required' },
        { status: 400 }
      );
    }

    const upsertData = entries.map((entry: any) => ({
      section,
      key: entry.key,
      content_type: entry.content_type || 'text',
      value: entry.value ?? null,
      order_number: entry.order_number ?? 0,
      is_active: entry.is_active ?? true,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('landing_content')
      .upsert(upsertData, { onConflict: 'section,key' })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidateTag('landing-content', { expire: 0 });
    return NextResponse.json({ content: data, message: `${section} section updated` });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove a landing content entry
export async function DELETE(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Content id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('landing_content')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Content deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
