// Admin API Route: Dashboard Statistics
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin, adminUnauthorizedResponse } from '@/lib/admin-guard';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return adminUnauthorizedResponse();

  try {
    const supabase = createAdminClient();

    // Fetch all stats in parallel
    const [usersRes, resultsRes, questionsRes, personalityRes, recentRes, branchRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('quiz_results').select('id', { count: 'exact', head: true }).not('completed_at', 'is', null),
      supabase.from('quiz_questions').select('id', { count: 'exact', head: true }),
      supabase.from('personality_types').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('quiz_results')
        .select('id, user_id, final_juz, branch_category, had_tie, completed_at')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10),
      supabase.from('quiz_results')
        .select('branch_category')
        .not('completed_at', 'is', null)
        .not('branch_category', 'is', null),
    ]);

    // Personality distribution
    const juzDistribution: Record<number, number> = {};
    if (recentRes.data) {
      // Fetch all completed results for distribution
      const { data: allResults } = await supabase
        .from('quiz_results')
        .select('final_juz')
        .not('completed_at', 'is', null)
        .not('final_juz', 'is', null);

      if (allResults) {
        allResults.forEach((r) => {
          if (r.final_juz) {
            juzDistribution[r.final_juz] = (juzDistribution[r.final_juz] || 0) + 1;
          }
        });
      }
    }

    // Branch distribution
    const branchDistribution: Record<string, number> = {};
    if (branchRes.data) {
      branchRes.data.forEach((r) => {
        if (r.branch_category) {
          branchDistribution[r.branch_category] = (branchDistribution[r.branch_category] || 0) + 1;
        }
      });
    }

    // Enrich recent results with user info
    let recentActivity: any[] = [];
    if (recentRes.data && recentRes.data.length > 0) {
      const userIds = [...new Set(recentRes.data.map((r) => r.user_id).filter(Boolean))];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      const userMap = new Map((users || []).map((u) => [u.id, u]));

      recentActivity = recentRes.data.map((r) => {
        const user = r.user_id ? userMap.get(r.user_id) : null;
        return {
          id: r.id,
          userName: user?.name || 'Anonymous',
          userEmail: user?.email || '—',
          finalJuz: r.final_juz,
          branchCategory: r.branch_category,
          hadTie: r.had_tie,
          completedAt: r.completed_at,
        };
      });
    }

    return NextResponse.json({
      stats: {
        totalUsers: usersRes.count || 0,
        totalQuizCompleted: resultsRes.count || 0,
        totalQuestions: questionsRes.count || 0,
        totalActivePersonalities: personalityRes.count || 0,
      },
      recentActivity,
      juzDistribution,
      branchDistribution,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
