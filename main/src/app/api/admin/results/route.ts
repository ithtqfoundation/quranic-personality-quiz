// Admin API Route: Quiz Results List
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const juz = searchParams.get('juz');
    const branch = searchParams.get('branch');

    // Single result detail
    if (id) {
      const { data: result, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !result) {
        return NextResponse.json({ error: 'Result not found' }, { status: 404 });
      }

      // Get user info
      let user = null;
      if (result.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, photo_url')
          .eq('id', result.user_id)
          .single();
        user = userData;
      }

      // Get answers
      const { data: answers } = await supabase
        .from('quiz_answers')
        .select('*, quiz_questions(question_text, layer, category), quiz_options(option_text, option_value, points)')
        .eq('result_id', id)
        .order('layer', { ascending: true });

      // Get personality info
      let personality = null;
      if (result.final_juz) {
        const { data: personalityData } = await supabase
          .from('personality_types')
          .select('*')
          .eq('juz_number', result.final_juz)
          .single();
        personality = personalityData;
      }

      return NextResponse.json({ result, user, answers: answers || [], personality });
    }

    // List results with filters and pagination
    let query = supabase
      .from('quiz_results')
      .select('*', { count: 'exact' });

    if (juz) {
      query = query.eq('final_juz', parseInt(juz));
    }
    if (branch) {
      query = query.eq('branch_category', branch);
    }

    // Only completed results by default
    query = query.not('completed_at', 'is', null);

    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('completed_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with user info
    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    let userMap = new Map<string, any>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      if (users) {
        users.forEach((u) => userMap.set(u.id, u));
      }
    }

    // Enrich with personality names
    const juzNumbers = [...new Set((data || []).map((r) => r.final_juz).filter(Boolean))];
    let personalityMap = new Map<number, string>();
    if (juzNumbers.length > 0) {
      const { data: personalities } = await supabase
        .from('personality_types')
        .select('juz_number, name')
        .in('juz_number', juzNumbers);
      if (personalities) {
        personalities.forEach((p) => personalityMap.set(p.juz_number, p.name));
      }
    }

    const enrichedResults = (data || []).map((r) => {
      const user = r.user_id ? userMap.get(r.user_id) : null;
      return {
        ...r,
        user_name: user?.name || 'Anonymous',
        user_email: user?.email || '—',
        personality_name: r.final_juz ? personalityMap.get(r.final_juz) || null : null,
      };
    });

    return NextResponse.json({
      results: enrichedResults,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
