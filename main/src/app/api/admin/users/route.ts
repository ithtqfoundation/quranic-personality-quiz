// Admin API Route: Users List
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
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Single user detail with quiz history
    if (id) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Fetch quiz results for this user
      const { data: results } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', id)
        .order('completed_at', { ascending: false });

      return NextResponse.json({ user, quizResults: results || [] });
    }

    // List users with search and pagination
    let query = supabase.from('users').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get quiz count per user
    const userIds = (data || []).map((u) => u.id);
    let quizCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: resultCounts } = await supabase
        .from('quiz_results')
        .select('user_id')
        .in('user_id', userIds)
        .not('completed_at', 'is', null);

      if (resultCounts) {
        resultCounts.forEach((r) => {
          if (r.user_id) {
            quizCounts[r.user_id] = (quizCounts[r.user_id] || 0) + 1;
          }
        });
      }
    }

    const usersWithCounts = (data || []).map((u) => ({
      ...u,
      quiz_count: quizCounts[u.id] || 0,
    }));

    return NextResponse.json({
      users: usersWithCounts,
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
