// Admin API Route: Questions CRUD
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const layer = searchParams.get('layer');

    let query = supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .order('layer', { ascending: true })
      .order('order_number', { ascending: true });

    if (layer) {
      query = query.eq('layer', parseInt(layer));
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions: data || [] });
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
    const { options, ...questionData } = body;

    if (!questionData.question_text || !questionData.layer) {
      return NextResponse.json({ error: 'question_text and layer are required' }, { status: 400 });
    }

    // Insert question
    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .insert([questionData])
      .select()
      .single();

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    // Insert options
    if (options && Array.isArray(options) && options.length > 0) {
      const optionsWithQuestionId = options.map((opt: any) => ({
        ...opt,
        question_id: question.id,
      }));

      const { error: oError } = await supabase
        .from('quiz_options')
        .insert(optionsWithQuestionId);

      if (oError) {
        console.error('Options insert error:', oError);
      }
    }

    // Re-fetch with options
    const { data: fullQuestion } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('id', question.id)
      .single();

    return NextResponse.json({ question: fullQuestion }, { status: 201 });
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
    const { id, options, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Question id is required' }, { status: 400 });
    }

    // Update question
    const { error: qError } = await supabase
      .from('quiz_questions')
      .update(updateData)
      .eq('id', id);

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    // Update options: delete existing and re-insert
    if (options && Array.isArray(options)) {
      await supabase.from('quiz_options').delete().eq('question_id', id);

      if (options.length > 0) {
        const optionsWithQuestionId = options.map((opt: any) => ({
          option_text: opt.option_text,
          option_value: opt.option_value,
          points: opt.points ?? 0,
          order_number: opt.order_number ?? 0,
          question_id: id,
        }));

        await supabase.from('quiz_options').insert(optionsWithQuestionId);
      }
    }

    // Re-fetch
    const { data: fullQuestion } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('id', id)
      .single();

    return NextResponse.json({ question: fullQuestion });
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
      return NextResponse.json({ error: 'Question id is required' }, { status: 400 });
    }

    // Delete options first (cascade)
    await supabase.from('quiz_options').delete().eq('question_id', parseInt(id));

    // Delete question
    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
